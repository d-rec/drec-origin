/**
 * Fails the build if a request-body DTO has a property with no
 * class-validator decorator.
 *
 * The global ValidationPipe runs with `whitelist: true` (src/index.ts). That
 * option DELETES every property of a validated object that carries no
 * class-validator decorator -- silently, with no validation error and no log
 * line. The property simply is not there when the handler runs.
 *
 * That cost us two production-visible outages on develop and stage between
 * 2026-09-16 and 2026-10-12: device registration (`deviceToRegister` was
 * undecorated, so the whole multipart body arrived empty and every submit
 * reported "Organization id is required") and DeepL translation
 * (`TranslateDto` had no decorators at all, so the service threw on
 * `text.reduce`). Neither produced an error message pointing anywhere near
 * the cause. This check exists so the next one is caught at review time.
 *
 * What it inspects: the type of every `@Body()` parameter in every
 * controller, plus base classes, plus -- and only -- the types of properties
 * carrying `@ValidateNested()`, because that is exactly when class-validator
 * descends into a nested object and whitelists its properties too.
 *
 * Usage:  pnpm run check:dto-decorators
 *         pnpm run check:dto-decorators -- --verbose
 */
import * as path from 'path';
import * as ts from 'typescript';

/**
 * Properties that MUST stay undecorated. Every entry needs a reason: an
 * allowlist without one becomes a place to silence this check.
 */
const ALLOWED: Record<string, string> = {
  'NewPermissionDTO.permissionValue':
    'Server-computed. DecimalPermissionValue.computePermissions() derives it ' +
    'from `permissions` and PermissionService spreads it over the body value, ' +
    'so a client-supplied bitmask would be a privilege escalation. Being ' +
    'stripped is the point.',
  'UpdatePermissionDTO.permissionValue':
    'Server-computed -- see NewPermissionDTO.permissionValue.',
  'NewRegistrantPermissionDTO.permissionValue':
    'Server-computed -- see NewPermissionDTO.permissionValue.',
  'NewACLModuleDTO.permissionsValue':
    'Server-computed from `permissions` by ' +
    'AccessControlLayerModuleServiceService; same privilege-escalation ' +
    'reasoning as NewPermissionDTO.permissionValue.',
  'AddGroupDTO.api_user_id':
    'Server-assigned. BuyerReservationController.createOne/updateOne sets it ' +
    'from the authenticated user after validation runs, so having the pipe ' +
    'strip a client-supplied value is the behaviour we want -- decorating it ' +
    "would let a caller claim another organization's api_user_id.",
};

/** Decorators that do not keep a property through whitelisting. */
const NON_VALIDATOR_DECORATORS = new Set([
  'ApiProperty',
  'ApiPropertyOptional',
  'ApiHideProperty',
  'Expose',
  'Exclude',
  'Type',
  'Transform',
  'Column',
  'PrimaryColumn',
  'PrimaryGeneratedColumn',
  'CreateDateColumn',
  'UpdateDateColumn',
  'ManyToOne',
  'OneToMany',
  'OneToOne',
  'ManyToMany',
  'JoinColumn',
  'JoinTable',
  'Index',
]);

const verbose = process.argv.includes('--verbose');
const apiRoot = path.resolve(__dirname, '..');

function loadProgram(): ts.Program {
  const configPath = path.join(apiRoot, 'tsconfig.json');
  const read = ts.readConfigFile(configPath, ts.sys.readFile);
  if (read.error) {
    throw new Error(
      ts.flattenDiagnosticMessageText(read.error.messageText, '\n'),
    );
  }
  const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, apiRoot);
  // Type information only; never emit.
  return ts.createProgram({
    rootNames: parsed.fileNames,
    options: { ...parsed.options, noEmit: true },
  });
}

const program = loadProgram();
const checker = program.getTypeChecker();

function decoratorNames(node: ts.Node): string[] {
  const decorators = ts.canHaveDecorators(node)
    ? ts.getDecorators(node)
    : undefined;
  if (!decorators) return [];
  return decorators
    .map((d) => {
      const expr = ts.isCallExpression(d.expression)
        ? d.expression.expression
        : d.expression;
      return ts.isIdentifier(expr)
        ? expr.text
        : ts.isPropertyAccessExpression(expr)
          ? expr.name.text
          : '';
    })
    .filter(Boolean);
}

/** Does this property survive `whitelist: true`? */
function hasValidatorDecorator(node: ts.Node): boolean {
  return decoratorNames(node).some((n) => !NON_VALIDATOR_DECORATORS.has(n));
}

/** Unwrap arrays, promises, unions and optionality down to class declarations. */
function classesOf(
  type: ts.Type,
  seen = new Set<ts.Type>(),
): ts.ClassDeclaration[] {
  if (seen.has(type)) return [];
  seen.add(type);
  const out: ts.ClassDeclaration[] = [];

  if (type.isUnion() || type.isIntersection()) {
    for (const t of type.types) out.push(...classesOf(t, seen));
    return out;
  }
  const ref = type as ts.TypeReference;
  if (checker.isArrayType(type) || checker.isTupleType(type)) {
    for (const t of checker.getTypeArguments(ref) ?? [])
      out.push(...classesOf(t, seen));
    return out;
  }
  for (const decl of type.getSymbol()?.getDeclarations() ?? []) {
    if (ts.isClassDeclaration(decl)) out.push(decl);
  }
  return out;
}

type Finding = { cls: string; prop: string; file: string; line: number };

const findings: Finding[] = [];
const visited = new Set<ts.ClassDeclaration>();
const inspected: string[] = [];

function className(decl: ts.ClassDeclaration): string {
  return decl.name?.text ?? '(anonymous class)';
}

function where(node: ts.Node): { file: string; line: number } {
  const sf = node.getSourceFile();
  const { line } = sf.getLineAndCharacterOfPosition(node.getStart());
  return { file: path.relative(apiRoot, sf.fileName), line: line + 1 };
}

function inspectClass(decl: ts.ClassDeclaration): void {
  if (visited.has(decl)) return;
  visited.add(decl);
  const name = className(decl);
  inspected.push(name);

  // Base classes are validated as part of the subclass.
  for (const heritage of decl.heritageClauses ?? []) {
    if (heritage.token !== ts.SyntaxKind.ExtendsKeyword) continue;
    for (const expr of heritage.types) {
      // `extends PickType(UserDTO, [...])` and friends resolve through the
      // type checker; a plain identifier resolves directly.
      for (const base of classesOf(checker.getTypeAtLocation(expr)))
        inspectClass(base);
    }
  }

  for (const member of decl.members) {
    if (!ts.isPropertyDeclaration(member)) continue;
    if (member.modifiers?.some((m) => m.kind === ts.SyntaxKind.StaticKeyword))
      continue;
    // A property initialised to a function is a method in disguise; skip.
    if (
      member.initializer &&
      (ts.isArrowFunction(member.initializer) ||
        ts.isFunctionExpression(member.initializer))
    ) {
      continue;
    }

    const propName = member.name.getText().replace(/^\[|\]$/g, '');
    const names = decoratorNames(member);

    if (!hasValidatorDecorator(member)) {
      const key = `${name}.${propName}`;
      if (!(key in ALLOWED))
        findings.push({ cls: name, prop: propName, ...where(member) });
      else if (verbose) console.log(`  allowed: ${key}`);
    }

    // class-validator only descends -- and therefore only whitelists --
    // inside a nested object when @ValidateNested is present.
    if (names.includes('ValidateNested') && member.type) {
      for (const nested of classesOf(checker.getTypeAtLocation(member.type)))
        inspectClass(nested);
    }
  }
}

// Roots: the type of every @Body() parameter in every controller.
let bodyParams = 0;
for (const sf of program.getSourceFiles()) {
  if (sf.isDeclarationFile) continue;
  if (!sf.fileName.endsWith('.controller.ts')) continue;

  const walk = (node: ts.Node): void => {
    if (ts.isParameter(node) && decoratorNames(node).includes('Body')) {
      bodyParams += 1;
      const type = node.type
        ? checker.getTypeAtLocation(node.type)
        : checker.getTypeAtLocation(node);
      for (const decl of classesOf(type)) inspectClass(decl);
    }
    ts.forEachChild(node, walk);
  };
  walk(sf);
}

const header = `Checked ${visited.size} DTO class(es) reachable from ${bodyParams} @Body() parameter(s).`;

if (verbose) {
  console.log(header);
  console.log('  ' + [...inspected].sort().join('\n  '));
}

if (findings.length === 0) {
  console.log(`${header} Every property carries a class-validator decorator.`);
  process.exit(0);
}

console.error(`\n${header}\n`);
console.error(
  `Found ${findings.length} propert${findings.length === 1 ? 'y' : 'ies'} with no class-validator decorator.`,
);
console.error(
  'The global ValidationPipe runs with `whitelist: true`, so each of these is\n' +
    'DELETED from the request body before the handler sees it -- silently, with\n' +
    'no validation error. The handler will read undefined.\n',
);
for (const f of findings) {
  console.error(`  ${f.cls}.${f.prop}`);
  console.error(`    ${f.file}:${f.line}`);
}
console.error(
  '\nFix each one by either:\n' +
    '  - giving it a real rule (@IsString, @IsInt, @IsArray, ...) -- preferred; or\n' +
    '  - @Allow() if it must pass through unvalidated (e.g. a JSON string the\n' +
    '    handler parses itself, or a file field read via @UploadedFiles()); or\n' +
    '  - deleting it, if nothing reads it; or\n' +
    '  - adding it to ALLOWED in ' +
    path.relative(apiRoot, __filename) +
    ' WITH A REASON, if it\n' +
    '    is server-assigned and being stripped is the point.\n',
);
process.exit(1);
