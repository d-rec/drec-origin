import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { AiAuditLog } from './ai-audit-log.entity';

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
const MAX_INPUT_CHARS = 8000;

/**
 * Disambiguating descriptions for each DocumentType slot. The bare
 * enum names ("SF_02C" vs "PROOF_OF_OWNERSHIP") aren't enough for the
 * model to make the right call — both look ownership-y in plain
 * English. These descriptions encode D-REC's domain meaning.
 */
const TYPE_DESCRIPTIONS: Record<string, string> = {
  FORM_SF_02:
    'SF-02 Production Facility Registration form (the I-REC standard registration form for the production facility itself; usually filled-in form fields with facility name, capacity, commissioning date)',
  SF_02C:
    "I-REC SF-02c Owner's Declaration LETTER — formal letter on the owner's letterhead declaring exclusive rights to the environmental/renewable attributes (the I-REC declaration), referencing I-REC code, attribute generation, hereby-declare phrasing",
  PROOF_OF_OWNERSHIP:
    'Proof of Ownership of the physical site/equipment — title deed, land lease, rooftop lease, PPA (Power Purchase Agreement), purchase contract, bill of sale. NOT the SF-02c declaration letter',
  METERING_EVIDENCE:
    'Meter readings, energy generation data, kWh/MWh production reports, monthly generation logs, screenshots of inverter/logger portals',
  SINGLE_LINE_DIAGRAM:
    'Electrical single-line diagram (SLD) — schematic showing inverter, transformer, breakers, busbars, AC/DC disconnects, grid connection',
  PROJECT_PHOTOS:
    'Photographs of the physical site, panels on roof or ground, installation evidence',
  COD_PROOF:
    'Commercial Operation Date proof — certificate or letter confirming the date the facility began commercial operation',
  FACILITY_BOUNDARY:
    'Map or diagram of the facility boundary / site layout footprint',
  OTHER_DOCUMENTS: 'Any other supporting document not matching the above types',
  INCORPORATION_CERTIFICATE:
    'Certificate of incorporation of the legal entity owning the facility',
  LEGAL_REPRESENTATIVE_PASSPORT:
    'Identity document (passport / ID) of the legal representative',
};

export interface ClassifyDocumentInput {
  filename: string;
  text: string;
  validTypes: string[];
}

export interface ClassifyDocumentResult {
  suggestedType: string;
  confidence: number;
  reasoning: string;
}

export interface ExtractCodFieldsInput {
  filename: string;
  text?: string;
  images?: Array<{
    base64: string;
    mimeType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
  }>;
}

export interface ExtractCodFieldsResult {
  commissioningDate?: ExtractedField<string>;
  facilityName?: ExtractedField<string>;
  acCapacityKw?: ExtractedField<number>;
  ownerName?: ExtractedField<string>;
  utilityOrIssuer?: ExtractedField<string>;
  reasoning: string;
}

export interface ExtractSf02FieldsInput {
  filename: string;
  text?: string;
  images?: Array<{
    base64: string;
    mimeType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
  }>;
}

export interface ExtractSf02FieldsResult {
  facilityName?: ExtractedField<string>;
  acCapacityKw?: ExtractedField<number>;
  commissioningDate?: ExtractedField<string>;
  deviceTypeCode?: ExtractedField<string>;
  ownerLegalName?: ExtractedField<string>;
  ownerAddress?: ExtractedField<string>;
  ownerCountry?: ExtractedField<string>;
  latitude?: ExtractedField<number>;
  longitude?: ExtractedField<number>;
  inverterCount?: ExtractedField<number>;
  moduleCount?: ExtractedField<number>;
  reasoning: string;
}

export interface ExtractSf02cFieldsInput {
  filename: string;
  text?: string;
  images?: Array<{
    base64: string;
    mimeType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
  }>;
}

export interface ExtractSf02cFieldsResult {
  projectName?: ExtractedField<string>;
  ownerLegalName?: ExtractedField<string>;
  ownerAddress?: ExtractedField<string>;
  ownerCountry?: ExtractedField<string>;
  signingDate?: ExtractedField<string>;
  signatoryName?: ExtractedField<string>;
  signatoryEmail?: ExtractedField<string>;
  reasoning: string;
}

export interface ExtractSldFieldsInput {
  filename: string;
  images: Array<{
    base64: string;
    mimeType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
  }>;
}

export interface ExtractedField<T> {
  value: T;
  confidence: number;
}

export interface ExtractSldFieldsResult {
  acCapacityKw?: ExtractedField<number>;
  dcCapacityKwp?: ExtractedField<number>;
  inverterCount?: ExtractedField<number>;
  inverterCapacityKw?: ExtractedField<number>;
  inverterMakeModel?: ExtractedField<string>;
  moduleCount?: ExtractedField<number>;
  moduleWattage?: ExtractedField<number>;
  gridVoltage?: ExtractedField<string>;
  gridTied?: ExtractedField<boolean>;
  zeroExport?: ExtractedField<boolean>;
  transformerKva?: ExtractedField<number>;
  reasoning: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @InjectRepository(AiAuditLog)
    private readonly audit: Repository<AiAuditLog>,
  ) {}

  /**
   * Classify a document by content. Returns the best-matching slot
   * from `validTypes`, a confidence (0..1), and a one-sentence
   * reasoning string. Document text is truncated to MAX_INPUT_CHARS
   * since the first page is enough and we pay per token.
   */
  async classifyDocument(
    input: ClassifyDocumentInput,
    apiKey: string,
    ctx: { userId?: number; organizationId?: number; deviceId?: number },
  ): Promise<ClassifyDocumentResult> {
    const client = new Anthropic({ apiKey });
    const text = (input.text || '').slice(0, MAX_INPUT_CHARS);
    const typeLines = input.validTypes
      .map((t) => `  - ${t}: ${TYPE_DESCRIPTIONS[t] ?? '(no description)'}`)
      .join('\n');
    const prompt = [
      `You are classifying a document for the D-REC platform (renewable-energy certificate registration).`,
      ``,
      `CRITICAL DISAMBIGUATION between two slots that BOTH mention ownership:`,
      `  • SF_02C is the I-REC "Owner's Declaration" letter — a declaration of ATTRIBUTE rights (renewable / environmental / carbon ATTRIBUTES). It is signed by the owner and references I-REC. If the document declares rights over RENEWABLE/ENVIRONMENTAL/CARBON ATTRIBUTES or generation, it is SF_02C — even though the word "ownership" appears.`,
      `  • PROOF_OF_OWNERSHIP is evidence of ownership of the PHYSICAL ASSET (the site / land / panels / equipment): a title deed, land lease, rooftop lease, PPA, purchase contract, bill of sale.`,
      `Rule of thumb: "owns the attributes / I-REC / declaration" → SF_02C. "owns the land / equipment / physical site" → PROOF_OF_OWNERSHIP.`,
      ``,
      `Pick exactly one of:`,
      typeLines,
      ``,
      `Filename: ${input.filename}`,
      `First-page text:`,
      `"""`,
      text,
      `"""`,
      ``,
      `Respond with strict JSON, no prose, no markdown fences:`,
      `{"suggestedType": "<one of the listed types>", "confidence": <0..1>, "reasoning": "<one short sentence>"}`,
    ].join('\n');

    const startedAt = Date.now();
    let inputTokens = 0;
    let outputTokens = 0;
    let success = false;
    let errorMessage: string | null = null;
    try {
      const res = await client.messages.create({
        model: HAIKU_MODEL,
        max_tokens: 256,
        temperature: 0,
        messages: [{ role: 'user', content: prompt }],
      });
      inputTokens = res.usage?.input_tokens ?? 0;
      outputTokens = res.usage?.output_tokens ?? 0;
      const block = res.content.find((c) => c.type === 'text') as
        | { type: 'text'; text: string }
        | undefined;
      const raw = block?.text?.trim() ?? '';
      const parsed = this.parseJson(raw);
      if (
        !parsed ||
        typeof parsed.suggestedType !== 'string' ||
        !input.validTypes.includes(parsed.suggestedType)
      ) {
        throw new Error(`Model returned unparseable / off-list response: ${raw}`);
      }
      const result: ClassifyDocumentResult = {
        suggestedType: parsed.suggestedType,
        confidence: this.clampConfidence(parsed.confidence),
        reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : '',
      };
      success = true;
      return result;
    } catch (err: any) {
      errorMessage = err?.message ?? String(err);
      throw err;
    } finally {
      void this.audit
        .insert({
          endpoint: 'classify-document',
          model: HAIKU_MODEL,
          inputTokens,
          outputTokens,
          userId: ctx.userId ?? null,
          organizationId: ctx.organizationId ?? null,
          deviceId: ctx.deviceId ?? null,
          success,
          errorMessage,
        })
        .catch((auditErr) =>
          this.logger.warn(`audit insert failed: ${auditErr?.message}`),
        );
      this.logger.log(
        `classify-document: ${success ? 'ok' : 'fail'} in=${inputTokens} out=${outputTokens} ${Date.now() - startedAt}ms`,
      );
    }
  }

  /**
   * Extract structured fields from an SLD image. The frontend renders
   * page 1 of the SLD PDF to a canvas and sends the base64 PNG; we
   * call Haiku 4.5 vision with a prompt that asks for each field
   * individually with its own confidence so the UI can decide which
   * to auto-fill (>=0.8) vs. surface as a suggestion only.
   */
  async extractSldFields(
    input: ExtractSldFieldsInput,
    apiKey: string,
    ctx: { userId?: number; organizationId?: number; deviceId?: number },
  ): Promise<ExtractSldFieldsResult> {
    const client = new Anthropic({ apiKey });
    const prompt = [
      `You are reading a Single Line Diagram (SLD) from a solar PV installation.`,
      ``,
      `Extract these fields from the diagram. Use null for any field you cannot read with reasonable certainty. Each field has its own 0..1 confidence.`,
      ``,
      `  - acCapacityKw: total AC-side capacity in kW (e.g. inverter total, plant nameplate)`,
      `  - dcCapacityKwp: total DC-side capacity in kWp (module-side, sum of module wattages)`,
      `  - inverterCount: number of inverters`,
      `  - inverterCapacityKw: capacity of EACH inverter in kW (if mixed sizes, the most common one)`,
      `  - inverterMakeModel: manufacturer + model string (e.g. "Goodwe GW50K-MT")`,
      `  - moduleCount: total number of PV modules`,
      `  - moduleWattage: per-module wattage in W (e.g. 545)`,
      `  - gridVoltage: grid connection voltage as written (e.g. "400V", "11kV", "33kV")`,
      `  - gridTied: true if connected to utility grid, false if off-grid only`,
      `  - zeroExport: true if a zero-export controller / no-export-to-grid is shown`,
      `  - transformerKva: transformer rating in kVA when shown`,
      ``,
      `Respond with strict JSON only, no prose, no markdown fences. Use null for unknown values:`,
      `{`,
      `  "acCapacityKw": {"value": <number|null>, "confidence": <0..1>},`,
      `  "dcCapacityKwp": {"value": <number|null>, "confidence": <0..1>},`,
      `  "inverterCount": {"value": <integer|null>, "confidence": <0..1>},`,
      `  "inverterCapacityKw": {"value": <number|null>, "confidence": <0..1>},`,
      `  "inverterMakeModel": {"value": <string|null>, "confidence": <0..1>},`,
      `  "moduleCount": {"value": <integer|null>, "confidence": <0..1>},`,
      `  "moduleWattage": {"value": <integer|null>, "confidence": <0..1>},`,
      `  "gridVoltage": {"value": <string|null>, "confidence": <0..1>},`,
      `  "gridTied": {"value": <boolean|null>, "confidence": <0..1>},`,
      `  "zeroExport": {"value": <boolean|null>, "confidence": <0..1>},`,
      `  "transformerKva": {"value": <number|null>, "confidence": <0..1>},`,
      `  "reasoning": "<one short sentence summarising what you read>"`,
      `}`,
    ].join('\n');

    const startedAt = Date.now();
    let inputTokens = 0;
    let outputTokens = 0;
    let success = false;
    let errorMessage: string | null = null;
    try {
      const imageBlocks = input.images.map((img) => ({
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: img.mimeType,
          data: img.base64,
        },
      }));
      const res = await client.messages.create({
        model: HAIKU_MODEL,
        max_tokens: 1024,
        temperature: 0,
        messages: [
          {
            role: 'user',
            content: [
              ...imageBlocks,
              { type: 'text', text: prompt },
            ],
          },
        ],
      });
      inputTokens = res.usage?.input_tokens ?? 0;
      outputTokens = res.usage?.output_tokens ?? 0;
      const block = res.content.find((c) => c.type === 'text') as
        | { type: 'text'; text: string }
        | undefined;
      const raw = block?.text?.trim() ?? '';
      const parsed = this.parseJson(raw);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error(`Model returned unparseable response: ${raw}`);
      }
      const result = this.normalizeSldResult(parsed);
      success = true;
      return result;
    } catch (err: any) {
      errorMessage = err?.message ?? String(err);
      throw err;
    } finally {
      void this.audit
        .insert({
          endpoint: 'extract-sld-fields',
          model: HAIKU_MODEL,
          inputTokens,
          outputTokens,
          userId: ctx.userId ?? null,
          organizationId: ctx.organizationId ?? null,
          deviceId: ctx.deviceId ?? null,
          success,
          errorMessage,
        })
        .catch((auditErr) =>
          this.logger.warn(`audit insert failed: ${auditErr?.message}`),
        );
      this.logger.log(
        `extract-sld-fields: ${success ? 'ok' : 'fail'} in=${inputTokens} out=${outputTokens} ${Date.now() - startedAt}ms`,
      );
    }
  }

  /**
   * Extract owner / project / signing fields from an SF-02c letter.
   * Most SF-02c documents are text-layer PDFs (generated from a Word
   * template), so the cheap path is to send the extracted text to a
   * normal (non-vision) Haiku call. We accept an optional images[]
   * fallback for the rare scanned case.
   */
  async extractSf02cFields(
    input: ExtractSf02cFieldsInput,
    apiKey: string,
    ctx: { userId?: number; organizationId?: number; deviceId?: number },
  ): Promise<ExtractSf02cFieldsResult> {
    const client = new Anthropic({ apiKey });
    const promptInstructions = [
      `You are reading an "SF-02c Owner's Declaration" letter — a formal letter on the asset owner's letterhead declaring exclusive rights to renewable / environmental / carbon attributes per the I-REC code.`,
      ``,
      `Extract these fields. Use null for any field you cannot read with reasonable certainty. Each field has its own 0..1 confidence.`,
      ``,
      `  - projectName: site / project / facility name as written (e.g. "Adupi-Emiriko", "Atsawa Solar Project")`,
      `  - ownerLegalName: full legal name of the organization that owns the facility (typically the entity signing the letter)`,
      `  - ownerAddress: owner's mailing address (single line)`,
      `  - ownerCountry: country name OR ISO-2 code (e.g. "Nigeria" or "NG"). Pick whichever you can read most clearly.`,
      `  - signingDate: ISO-8601 date (YYYY-MM-DD). Convert from any format on the letter.`,
      `  - signatoryName: name of the person who signed`,
      `  - signatoryEmail: email of the signatory if present`,
      ``,
      `Respond with strict JSON only, no prose, no markdown fences. Use null for unknown values:`,
      `{`,
      `  "projectName": {"value": <string|null>, "confidence": <0..1>},`,
      `  "ownerLegalName": {"value": <string|null>, "confidence": <0..1>},`,
      `  "ownerAddress": {"value": <string|null>, "confidence": <0..1>},`,
      `  "ownerCountry": {"value": <string|null>, "confidence": <0..1>},`,
      `  "signingDate": {"value": <string|null>, "confidence": <0..1>},`,
      `  "signatoryName": {"value": <string|null>, "confidence": <0..1>},`,
      `  "signatoryEmail": {"value": <string|null>, "confidence": <0..1>},`,
      `  "reasoning": "<one short sentence summarising what you read>"`,
      `}`,
    ].join('\n');

    const startedAt = Date.now();
    let inputTokens = 0;
    let outputTokens = 0;
    let success = false;
    let errorMessage: string | null = null;
    try {
      const content: any[] = [];
      if (input.images && input.images.length) {
        for (const img of input.images) {
          content.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: img.mimeType,
              data: img.base64,
            },
          });
        }
      }
      if (input.text && input.text.trim().length) {
        const text = input.text.slice(0, MAX_INPUT_CHARS);
        content.push({
          type: 'text',
          text: `Letter text:\n"""\n${text}\n"""\n\n${promptInstructions}`,
        });
      } else {
        content.push({ type: 'text', text: promptInstructions });
      }
      const res = await client.messages.create({
        model: HAIKU_MODEL,
        max_tokens: 1024,
        temperature: 0,
        messages: [{ role: 'user', content }],
      });
      inputTokens = res.usage?.input_tokens ?? 0;
      outputTokens = res.usage?.output_tokens ?? 0;
      const block = res.content.find((c) => c.type === 'text') as
        | { type: 'text'; text: string }
        | undefined;
      const raw = block?.text?.trim() ?? '';
      const parsed = this.parseJson(raw);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error(`Model returned unparseable response: ${raw}`);
      }
      const result = this.normalizeSf02cResult(parsed);
      success = true;
      return result;
    } catch (err: any) {
      errorMessage = err?.message ?? String(err);
      throw err;
    } finally {
      void this.audit
        .insert({
          endpoint: 'extract-sf02c-fields',
          model: HAIKU_MODEL,
          inputTokens,
          outputTokens,
          userId: ctx.userId ?? null,
          organizationId: ctx.organizationId ?? null,
          deviceId: ctx.deviceId ?? null,
          success,
          errorMessage,
        })
        .catch((auditErr) =>
          this.logger.warn(`audit insert failed: ${auditErr?.message}`),
        );
      this.logger.log(
        `extract-sf02c-fields: ${success ? 'ok' : 'fail'} in=${inputTokens} out=${outputTokens} ${Date.now() - startedAt}ms`,
      );
    }
  }

  async extractCodFields(
    input: ExtractCodFieldsInput,
    apiKey: string,
    ctx: { userId?: number; organizationId?: number; deviceId?: number },
  ): Promise<ExtractCodFieldsResult> {
    const promptInstructions = [
      `You are reading a "Commercial Operation Date" (COD) proof — a certificate or letter from a utility / regulator / EPC stating the date the solar facility began commercial operation.`,
      ``,
      `Extract these fields. Use null where unknown.`,
      `  - commissioningDate: ISO-8601 (YYYY-MM-DD)`,
      `  - facilityName: site / plant name as written`,
      `  - acCapacityKw: AC capacity in kW (convert from kVA / MW if needed)`,
      `  - ownerName: facility owner organization`,
      `  - utilityOrIssuer: who issued / signed the COD letter`,
      ``,
      `Strict JSON, no markdown, no prose:`,
      `{`,
      `  "commissioningDate": {"value": <string|null>, "confidence": <0..1>},`,
      `  "facilityName": {"value": <string|null>, "confidence": <0..1>},`,
      `  "acCapacityKw": {"value": <number|null>, "confidence": <0..1>},`,
      `  "ownerName": {"value": <string|null>, "confidence": <0..1>},`,
      `  "utilityOrIssuer": {"value": <string|null>, "confidence": <0..1>},`,
      `  "reasoning": "<one short sentence>"`,
      `}`,
    ].join('\n');
    const parsed = await this.runDocExtraction(
      'extract-cod-fields',
      input,
      apiKey,
      ctx,
      promptInstructions,
    );
    return {
      commissioningDate: this.strField(parsed.commissioningDate),
      facilityName: this.strField(parsed.facilityName),
      acCapacityKw: this.numField(parsed.acCapacityKw),
      ownerName: this.strField(parsed.ownerName),
      utilityOrIssuer: this.strField(parsed.utilityOrIssuer),
      reasoning:
        typeof parsed.reasoning === 'string' ? parsed.reasoning : '',
    };
  }

  async extractSf02Fields(
    input: ExtractSf02FieldsInput,
    apiKey: string,
    ctx: { userId?: number; organizationId?: number; deviceId?: number },
  ): Promise<ExtractSf02FieldsResult> {
    const promptInstructions = [
      `You are reading an "SF-02 Production Facility Registration" form — the I-REC standard registration form for a renewable generation facility. Most fields are filled-in form values.`,
      ``,
      `Extract:`,
      `  - facilityName: site/plant name`,
      `  - acCapacityKw: nameplate AC capacity in kW`,
      `  - commissioningDate: ISO-8601 YYYY-MM-DD`,
      `  - deviceTypeCode: I-REC fuel/technology code as written (e.g. "TC100", "Solar PV")`,
      `  - ownerLegalName: facility owner / participant legal name`,
      `  - ownerAddress: address (single line)`,
      `  - ownerCountry: country name OR ISO-2 code`,
      `  - latitude: decimal degrees (positive N, negative S)`,
      `  - longitude: decimal degrees (positive E, negative W)`,
      `  - inverterCount: number of inverters`,
      `  - moduleCount: total module count`,
      ``,
      `Strict JSON only:`,
      `{`,
      `  "facilityName": {"value": <string|null>, "confidence": <0..1>},`,
      `  "acCapacityKw": {"value": <number|null>, "confidence": <0..1>},`,
      `  "commissioningDate": {"value": <string|null>, "confidence": <0..1>},`,
      `  "deviceTypeCode": {"value": <string|null>, "confidence": <0..1>},`,
      `  "ownerLegalName": {"value": <string|null>, "confidence": <0..1>},`,
      `  "ownerAddress": {"value": <string|null>, "confidence": <0..1>},`,
      `  "ownerCountry": {"value": <string|null>, "confidence": <0..1>},`,
      `  "latitude": {"value": <number|null>, "confidence": <0..1>},`,
      `  "longitude": {"value": <number|null>, "confidence": <0..1>},`,
      `  "inverterCount": {"value": <integer|null>, "confidence": <0..1>},`,
      `  "moduleCount": {"value": <integer|null>, "confidence": <0..1>},`,
      `  "reasoning": "<one short sentence>"`,
      `}`,
    ].join('\n');
    const parsed = await this.runDocExtraction(
      'extract-sf02-fields',
      input,
      apiKey,
      ctx,
      promptInstructions,
    );
    return {
      facilityName: this.strField(parsed.facilityName),
      acCapacityKw: this.numField(parsed.acCapacityKw),
      commissioningDate: this.strField(parsed.commissioningDate),
      deviceTypeCode: this.strField(parsed.deviceTypeCode),
      ownerLegalName: this.strField(parsed.ownerLegalName),
      ownerAddress: this.strField(parsed.ownerAddress),
      ownerCountry: this.strField(parsed.ownerCountry),
      latitude: this.numField(parsed.latitude),
      longitude: this.numField(parsed.longitude),
      inverterCount: this.numField(parsed.inverterCount),
      moduleCount: this.numField(parsed.moduleCount),
      reasoning:
        typeof parsed.reasoning === 'string' ? parsed.reasoning : '',
    };
  }

  /**
   * Shared text-or-vision Haiku call used by extract-cod-fields and
   * extract-sf02-fields. Returns the parsed JSON object — caller is
   * responsible for shaping it into its typed result.
   */
  private async runDocExtraction(
    endpoint: string,
    input: {
      filename: string;
      text?: string;
      images?: Array<{
        base64: string;
        mimeType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
      }>;
    },
    apiKey: string,
    ctx: { userId?: number; organizationId?: number; deviceId?: number },
    promptInstructions: string,
  ): Promise<any> {
    const client = new Anthropic({ apiKey });
    const startedAt = Date.now();
    let inputTokens = 0;
    let outputTokens = 0;
    let success = false;
    let errorMessage: string | null = null;
    try {
      const content: any[] = [];
      if (input.images && input.images.length) {
        for (const img of input.images) {
          content.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: img.mimeType,
              data: img.base64,
            },
          });
        }
      }
      if (input.text && input.text.trim().length) {
        const text = input.text.slice(0, MAX_INPUT_CHARS);
        content.push({
          type: 'text',
          text: `Document text:\n"""\n${text}\n"""\n\n${promptInstructions}`,
        });
      } else {
        content.push({ type: 'text', text: promptInstructions });
      }
      const res = await client.messages.create({
        model: HAIKU_MODEL,
        max_tokens: 1024,
        temperature: 0,
        messages: [{ role: 'user', content }],
      });
      inputTokens = res.usage?.input_tokens ?? 0;
      outputTokens = res.usage?.output_tokens ?? 0;
      const block = res.content.find((c) => c.type === 'text') as
        | { type: 'text'; text: string }
        | undefined;
      const raw = block?.text?.trim() ?? '';
      const parsed = this.parseJson(raw);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error(`Model returned unparseable response: ${raw}`);
      }
      success = true;
      return parsed;
    } catch (err: any) {
      errorMessage = err?.message ?? String(err);
      throw err;
    } finally {
      void this.audit
        .insert({
          endpoint,
          model: HAIKU_MODEL,
          inputTokens,
          outputTokens,
          userId: ctx.userId ?? null,
          organizationId: ctx.organizationId ?? null,
          deviceId: ctx.deviceId ?? null,
          success,
          errorMessage,
        })
        .catch((auditErr) =>
          this.logger.warn(`audit insert failed: ${auditErr?.message}`),
        );
      this.logger.log(
        `${endpoint}: ${success ? 'ok' : 'fail'} in=${inputTokens} out=${outputTokens} ${Date.now() - startedAt}ms`,
      );
    }
  }

  private strField(raw: any): ExtractedField<string> | undefined {
    if (!raw || !raw.value) return undefined;
    return {
      value: String(raw.value).trim(),
      confidence: this.clampConfidence(raw.confidence),
    };
  }

  private numField(raw: any): ExtractedField<number> | undefined {
    if (!raw || raw.value === null || raw.value === undefined) return undefined;
    const v = typeof raw.value === 'number' ? raw.value : parseFloat(raw.value);
    if (!isFinite(v)) return undefined;
    return { value: v, confidence: this.clampConfidence(raw.confidence) };
  }

  private normalizeSf02cResult(parsed: any): ExtractSf02cFieldsResult {
    const strField = (raw: any): ExtractedField<string> | undefined => {
      if (!raw || !raw.value) return undefined;
      return {
        value: String(raw.value).trim(),
        confidence: this.clampConfidence(raw.confidence),
      };
    };
    return {
      projectName: strField(parsed.projectName),
      ownerLegalName: strField(parsed.ownerLegalName),
      ownerAddress: strField(parsed.ownerAddress),
      ownerCountry: strField(parsed.ownerCountry),
      signingDate: strField(parsed.signingDate),
      signatoryName: strField(parsed.signatoryName),
      signatoryEmail: strField(parsed.signatoryEmail),
      reasoning:
        typeof parsed.reasoning === 'string' ? parsed.reasoning : '',
    };
  }

  private normalizeSldResult(parsed: any): ExtractSldFieldsResult {
    const numField = (
      raw: any,
    ): ExtractedField<number> | undefined => {
      if (!raw || raw.value === null || raw.value === undefined) return undefined;
      const v = typeof raw.value === 'number' ? raw.value : parseFloat(raw.value);
      if (!isFinite(v)) return undefined;
      return { value: v, confidence: this.clampConfidence(raw.confidence) };
    };
    const strField = (
      raw: any,
    ): ExtractedField<string> | undefined => {
      if (!raw || !raw.value) return undefined;
      return {
        value: String(raw.value),
        confidence: this.clampConfidence(raw.confidence),
      };
    };
    const boolField = (
      raw: any,
    ): ExtractedField<boolean> | undefined => {
      if (!raw || raw.value === null || raw.value === undefined) return undefined;
      return {
        value: Boolean(raw.value),
        confidence: this.clampConfidence(raw.confidence),
      };
    };
    return {
      acCapacityKw: numField(parsed.acCapacityKw),
      dcCapacityKwp: numField(parsed.dcCapacityKwp),
      inverterCount: numField(parsed.inverterCount),
      inverterCapacityKw: numField(parsed.inverterCapacityKw),
      inverterMakeModel: strField(parsed.inverterMakeModel),
      moduleCount: numField(parsed.moduleCount),
      moduleWattage: numField(parsed.moduleWattage),
      gridVoltage: strField(parsed.gridVoltage),
      gridTied: boolField(parsed.gridTied),
      zeroExport: boolField(parsed.zeroExport),
      transformerKva: numField(parsed.transformerKva),
      reasoning:
        typeof parsed.reasoning === 'string' ? parsed.reasoning : '',
    };
  }

  private parseJson(raw: string): any {
    try {
      return JSON.parse(raw);
    } catch {
      // Models occasionally wrap JSON in ```json fences despite instructions.
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          return JSON.parse(m[0]);
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  private clampConfidence(v: any): number {
    const n = typeof v === 'number' ? v : parseFloat(v);
    if (!isFinite(n)) return 0.5;
    if (n < 0) return 0;
    if (n > 1) return 1;
    return n;
  }
}
