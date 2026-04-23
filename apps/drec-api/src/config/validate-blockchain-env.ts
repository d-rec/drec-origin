/**
 * Startup-time validator for blockchain env vars.
 *
 * History: when the PowerTrust dedicated environment was stood up
 * (2026-04-14), `DREC_BLOCKCHAIN_ADDRESS`, `REACT_APP_ISSUER_ADDRESS`, and the
 * group-level `device_group.buyerAddress` were all left at the null-address
 * placeholder `0x0000…0000`. The issuance pipeline kept running, minting
 * every certificate to the burn address. The customer polled for tokens for
 * eight days before anyone noticed. The failure was invisible because
 * nothing refused to boot.
 *
 * This validator runs once at `startAPI` time and refuses to boot if any
 * blockchain env var is explicitly set to the null address. Unset / empty
 * values are allowed — local dev commonly runs without them, and nothing
 * in the hot path reads an empty env var without its own guard. The
 * failure mode we're catching is specifically "set, but set to the
 * placeholder that any downstream code will treat as valid."
 */

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

const CHECKED_VARS = [
  'DREC_BLOCKCHAIN_ADDRESS',
  'REACT_APP_ISSUER_ADDRESS',
] as const;

export interface ValidationResult {
  readonly violations: ReadonlyArray<{ name: string; value: string }>;
}

export function validateBlockchainEnv(
  env: NodeJS.ProcessEnv = process.env,
): ValidationResult {
  const violations = CHECKED_VARS.map((name) => ({
    name,
    value: (env[name] ?? '').trim().toLowerCase(),
  })).filter((v) => v.value === NULL_ADDRESS);
  return { violations };
}

/** Throws (and kills startup) if the validator finds any placeholder nulls. */
export function assertValidBlockchainEnv(
  env: NodeJS.ProcessEnv = process.env,
): void {
  const { violations } = validateBlockchainEnv(env);
  if (violations.length === 0) return;

  const lines = [
    '',
    '  drec-api refuses to boot: one or more blockchain env vars are set',
    `  to the null address (${NULL_ADDRESS}).`,
    '',
    '  Offending vars:',
    ...violations.map((v) => `    - ${v.name}=${v.value}`),
    '',
    '  Minting to the null address silently burns every issued certificate.',
    '  Set these to real chain-account addresses before starting drec-api.',
    '',
  ];
  throw new Error(lines.join('\n'));
}
