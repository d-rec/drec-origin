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

export interface ExtractSldFieldsInput {
  filename: string;
  imageBase64: string;
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
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
      const res = await client.messages.create({
        model: HAIKU_MODEL,
        max_tokens: 1024,
        temperature: 0,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: input.mimeType,
                  data: input.imageBase64,
                },
              },
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
