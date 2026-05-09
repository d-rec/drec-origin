import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { AiAuditLog } from './ai-audit-log.entity';
import { AiResponseCache } from './ai-response-cache.entity';

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
  contentHash?: string;
}

export interface ClassifyDocumentResult {
  suggestedType: string;
  confidence: number;
  reasoning: string;
}

export interface ExtractMeterIdsInput {
  filename: string;
  text?: string;
  images?: Array<{
    base64: string;
    mimeType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
  }>;
  contentHash?: string;
}

export interface ExtractMeterIdsResult {
  measurementIds?: ExtractedField<string[]>;
  inverterMakeModel?: ExtractedField<string>;
  reasoning: string;
}

export interface ExtractCodFieldsInput {
  filename: string;
  text?: string;
  images?: Array<{
    base64: string;
    mimeType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
  }>;
  contentHash?: string;
}

export interface ExtractCodFieldsResult {
  commissioningDate?: ExtractedField<string>;
  facilityName?: ExtractedField<string>;
  acCapacityKw?: ExtractedField<number>;
  ownerName?: ExtractedField<string>;
  utilityOrIssuer?: ExtractedField<string>;
  measurementIds?: ExtractedField<string[]>;
  reasoning: string;
}

export interface ExtractSf02FieldsInput {
  filename: string;
  text?: string;
  images?: Array<{
    base64: string;
    mimeType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
  }>;
  contentHash?: string;
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
  networkOwner?: ExtractedField<string>;
  reasoning: string;
}

export interface ExtractSf02cFieldsInput {
  filename: string;
  text?: string;
  images?: Array<{
    base64: string;
    mimeType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
  }>;
  contentHash?: string;
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
  /** Optional embedded PDF text layer. CAD-exported SLDs encode every
   *  label as real text; passing it alongside the images dramatically
   *  improves recall on small / dense schematics that vision alone
   *  reads poorly (e.g. "HUAWEI SUN2000-30KTL-M3"). */
  text?: string;
  contentHash?: string;
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

// Anthropic Haiku 4.5 pricing as of 2026-05. Use for budget tracking.
// Input: $1/Mtok, Output: $5/Mtok.
const PRICE_INPUT_PER_MTOK = 1.0;
const PRICE_OUTPUT_PER_MTOK = 5.0;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @InjectRepository(AiAuditLog)
    private readonly audit: Repository<AiAuditLog>,
    @InjectRepository(AiResponseCache)
    private readonly cache: Repository<AiResponseCache>,
  ) {}

  /** Cache TTL in days. */
  private static readonly CACHE_TTL_DAYS = 7;

  /** Look up a previously-stored response by content hash + endpoint.
   *  Returns null on miss or if the row is older than CACHE_TTL_DAYS. */
  private async cacheLookup(
    contentHash: string | undefined,
    endpoint: string,
  ): Promise<any | null> {
    if (!contentHash) return null;
    const row = await this.cache.findOne({
      where: { contentHash, endpoint },
    });
    if (!row) return null;
    const ageMs = Date.now() - new Date(row.createdAt).getTime();
    if (ageMs > AiService.CACHE_TTL_DAYS * 86400 * 1000) return null;
    return row.response;
  }

  /** Store an extraction response keyed on (hash, endpoint). Upserts
   *  so a re-extraction overwrites stale data within the TTL window. */
  private async cacheStore(
    contentHash: string | undefined,
    endpoint: string,
    response: any,
  ): Promise<void> {
    if (!contentHash) return;
    try {
      await this.cache.query(
        `INSERT INTO "ai_response_cache" ("content_hash", "endpoint", "response", "created_at")
         VALUES ($1, $2, $3::jsonb, now())
         ON CONFLICT ("content_hash", "endpoint")
         DO UPDATE SET "response" = EXCLUDED."response", "created_at" = now()`,
        [contentHash, endpoint, JSON.stringify(response)],
      );
    } catch (err: any) {
      this.logger.warn(`cache store failed: ${err?.message}`);
    }
  }

  /** Audit a cache hit (0 tokens, success=true, marker on errorMessage). */
  private async auditCacheHit(
    endpoint: string,
    ctx: { userId?: number; organizationId?: number; deviceId?: number },
  ): Promise<void> {
    void this.audit
      .insert({
        endpoint,
        model: HAIKU_MODEL,
        inputTokens: 0,
        outputTokens: 0,
        userId: ctx.userId ?? null,
        organizationId: ctx.organizationId ?? null,
        deviceId: ctx.deviceId ?? null,
        success: true,
        errorMessage: 'cache hit',
      })
      .catch((err) => this.logger.warn(`audit insert failed: ${err?.message}`));
  }

  /**
   * Aggregated AI usage / cost stats. Used by the /admin/ai-usage page.
   * All numbers come from ai_audit_log (authoritative — token counts are
   * straight from Anthropic's response). Cost is computed at query time
   * using current Haiku pricing.
   */
  async getUsageSummary(): Promise<{
    monthToDate: {
      calls: number;
      inputTokens: number;
      outputTokens: number;
      estimatedUsd: number;
      successRate: number;
    };
    byEndpoint: Array<{
      endpoint: string;
      calls: number;
      inputTokens: number;
      outputTokens: number;
      estimatedUsd: number;
    }>;
    daily: Array<{ day: string; calls: number; estimatedUsd: number }>;
    topOrgs: Array<{
      organizationId: number | null;
      calls: number;
      estimatedUsd: number;
    }>;
  }> {
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const monthIso = monthStart.toISOString();

    const totals = await this.audit
      .createQueryBuilder('a')
      .select('COUNT(*)', 'calls')
      .addSelect('COALESCE(SUM(a.input_tokens), 0)', 'inputTokens')
      .addSelect('COALESCE(SUM(a.output_tokens), 0)', 'outputTokens')
      .addSelect(
        'COALESCE(SUM(CASE WHEN a.success THEN 1 ELSE 0 END), 0)',
        'successes',
      )
      .where('a.created_at >= :since', { since: monthIso })
      .getRawOne();

    const calls = Number(totals?.calls ?? 0);
    const inputTokens = Number(totals?.inputTokens ?? 0);
    const outputTokens = Number(totals?.outputTokens ?? 0);
    const successes = Number(totals?.successes ?? 0);

    const byEndpointRows = await this.audit
      .createQueryBuilder('a')
      .select('a.endpoint', 'endpoint')
      .addSelect('COUNT(*)', 'calls')
      .addSelect('COALESCE(SUM(a.input_tokens), 0)', 'inputTokens')
      .addSelect('COALESCE(SUM(a.output_tokens), 0)', 'outputTokens')
      .where('a.created_at >= :since', { since: monthIso })
      .groupBy('a.endpoint')
      .orderBy('"calls"', 'DESC')
      .getRawMany();

    const dailyRows = await this.audit
      .createQueryBuilder('a')
      .select("to_char(a.created_at, 'YYYY-MM-DD')", 'day')
      .addSelect('COUNT(*)', 'calls')
      .addSelect('COALESCE(SUM(a.input_tokens), 0)', 'inputTokens')
      .addSelect('COALESCE(SUM(a.output_tokens), 0)', 'outputTokens')
      .where("a.created_at >= now() - INTERVAL '30 days'")
      .groupBy("to_char(a.created_at, 'YYYY-MM-DD')")
      .orderBy('"day"', 'ASC')
      .getRawMany();

    const topOrgRows = await this.audit
      .createQueryBuilder('a')
      .select('a.organization_id', 'organizationId')
      .addSelect('COUNT(*)', 'calls')
      .addSelect('COALESCE(SUM(a.input_tokens), 0)', 'inputTokens')
      .addSelect('COALESCE(SUM(a.output_tokens), 0)', 'outputTokens')
      .where('a.created_at >= :since', { since: monthIso })
      .groupBy('a.organization_id')
      .orderBy(
        'SUM(a.input_tokens * ' +
          PRICE_INPUT_PER_MTOK +
          ' + a.output_tokens * ' +
          PRICE_OUTPUT_PER_MTOK +
          ')',
        'DESC',
      )
      .limit(10)
      .getRawMany();

    const dollars = (inT: number, outT: number) =>
      Number(
        (
          (inT * PRICE_INPUT_PER_MTOK + outT * PRICE_OUTPUT_PER_MTOK) /
          1_000_000
        ).toFixed(4),
      );

    return {
      monthToDate: {
        calls,
        inputTokens,
        outputTokens,
        estimatedUsd: dollars(inputTokens, outputTokens),
        successRate: calls ? Number((successes / calls).toFixed(3)) : 1,
      },
      byEndpoint: byEndpointRows.map((r) => ({
        endpoint: r.endpoint,
        calls: Number(r.calls),
        inputTokens: Number(r.inputTokens),
        outputTokens: Number(r.outputTokens),
        estimatedUsd: dollars(Number(r.inputTokens), Number(r.outputTokens)),
      })),
      daily: dailyRows.map((r) => ({
        day: r.day,
        calls: Number(r.calls),
        estimatedUsd: dollars(Number(r.inputTokens), Number(r.outputTokens)),
      })),
      topOrgs: topOrgRows.map((r) => ({
        organizationId: r.organizationId == null ? null : Number(r.organizationId),
        calls: Number(r.calls),
        estimatedUsd: dollars(Number(r.inputTokens), Number(r.outputTokens)),
      })),
    };
  }

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
      void this.cacheStore(input.contentHash, 'classify-document', result);
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
    const cached = await this.cacheLookup(
      input.contentHash,
      'extract-sld-fields',
    );
    if (cached) {
      void this.auditCacheHit('extract-sld-fields', ctx);
      this.logger.log('extract-sld-fields: cache hit');
      return cached as ExtractSldFieldsResult;
    }
    const client = new Anthropic({ apiKey });
    const prompt = [
      `You are reading a Single Line Diagram (SLD) from a solar PV installation.`,
      ``,
      `Extract these fields from the diagram. Use null for any field you cannot read with reasonable certainty. Each field has its own 0..1 confidence.`,
      ``,
      `  - acCapacityKw: total AC-side capacity in kW (e.g. inverter total, plant nameplate)`,
      `  - dcCapacityKwp: total DC-side capacity in kWp (module-side, sum of module wattages)`,
      `  - inverterCount: number of inverters`,
      `  - inverterCapacityKw: capacity of EACH inverter in kW (if mixed sizes, the most common one). Read the kW from a labelled "AC capacity" if shown, OR derive it from the model number when the manufacturer encodes it: Huawei SUN2000-30KTL-M3 = 30 kW, SUN2000-100KTL = 100 kW; Goodwe GW50K-MT = 50 kW, GW100K-HT = 100 kW; SolarEdge SE10K = 10 kW; Sungrow SG110CX = 110 kW.`,
      `  - inverterMakeModel: full manufacturer + model string as written on the diagram (e.g. "HUAWEI SUN2000-30KTL-M3", "Goodwe GW50K-MT"). Read inverter labels even when they sit alongside the inverter symbol rather than inside it.`,
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
      const textBlock = input.text && input.text.trim().length
        ? `\n\nPDF text layer (use to confirm labels the vision pass misses):\n"""\n${input.text.slice(0, MAX_INPUT_CHARS)}\n"""\n`
        : '';
      const res = await client.messages.create({
        model: HAIKU_MODEL,
        max_tokens: 1024,
        temperature: 0,
        messages: [
          {
            role: 'user',
            content: [
              ...imageBlocks,
              { type: 'text', text: prompt + textBlock },
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
      const result = this.deriveAcCapacityIfMissing(
        this.deriveInverterCapacityFromModel(this.normalizeSldResult(parsed)),
      );
      success = true;
      void this.cacheStore(input.contentHash, 'extract-sld-fields', result);
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

  /**
   * Extract inverter / meter measurement IDs from a metering-portal
   * screenshot or photo. Recall depends entirely on whether the
   * portal/photo actually shows the SN somewhere visible — partial
   * matches are fine since the user can click Apply on multiple
   * screenshots in succession.
   */
  async extractMeterIds(
    input: ExtractMeterIdsInput,
    apiKey: string,
    ctx: { userId?: number; organizationId?: number; deviceId?: number },
  ): Promise<ExtractMeterIdsResult> {
    const promptInstructions = [
      `You are reading a screenshot or photo from an inverter / meter monitoring portal (Goodwe SemsPortal, SolarEdge Monitoring, Huawei FusionSolar, PowerTrust portal, etc.) OR a close-up photo of an inverter nameplate sticker.`,
      ``,
      `Extract the inverter / meter / measurement serial numbers (SN). These are HARDWARE identifiers stamped on the device by its manufacturer.`,
      ``,
      `WHAT A VALID SN LOOKS LIKE:`,
      `  - Contiguous alphanumeric, typically 10-20 characters`,
      `  - No dashes, no spaces, no unit suffixes`,
      `  - Often starts with a vendor / country prefix (e.g. ES2340051281, 50000HSU012345, 7E12345678ABCD)`,
      `  - Usually appears under a label like "SN", "Serial", "Inverter ID", "Device SN", "Measurement ID"`,
      ``,
      `WHAT TO IGNORE (these are NOT serial numbers, even if they look ID-like):`,
      `  - Site / project / facility names (e.g. "IEA-NG-Site-01-Atsawa", "Plant-XYZ")`,
      `  - Plate-capacity tags (e.g. "Atsawa-100kWp", "Site-A-50kW")`,
      `  - Any string containing dashes (-) followed by descriptive text`,
      `  - Account / customer numbers, not device-specific`,
      `  - Unit values (kW, kWp, kVA, V, Hz)`,
      ``,
      `If you can't find a clear SN in the image, return an empty array — DO NOT substitute a site label or capacity tag.`,
      ``,
      `Extract:`,
      `  - measurementIds: array of contiguous-alphanumeric SN strings. Empty array [] if none clearly visible.`,
      `  - inverterMakeModel: manufacturer + model when visible (e.g. "Goodwe GW50K-MT")`,
      ``,
      `Strict JSON only:`,
      `{`,
      `  "measurementIds": {"value": <string[]|null>, "confidence": <0..1>},`,
      `  "inverterMakeModel": {"value": <string|null>, "confidence": <0..1>},`,
      `  "reasoning": "<one short sentence>"`,
      `}`,
    ].join('\n');
    const parsed = await this.runDocExtraction(
      'extract-meter-ids-fields',
      input,
      apiKey,
      ctx,
      promptInstructions,
    );
    const idsRaw = parsed?.measurementIds;
    let idsField: ExtractedField<string[]> | undefined;
    if (idsRaw && Array.isArray(idsRaw.value) && idsRaw.value.length) {
      // Server-side belt-and-suspenders filter: regardless of what
      // the prompt instructs, drop strings that don't look like a real
      // SN (must be 8-24 contiguous alphanumeric chars, no dashes/
      // spaces, can't end in a unit suffix). Keeps site labels and
      // capacity tags out of the result if the model slips up.
      const SN_RE = /^[A-Za-z0-9]{8,24}$/;
      const UNIT_TAIL_RE = /(kw|kwp|kva|hz|v)$/i;
      const cleaned = idsRaw.value
        .map((v: any) => (typeof v === 'string' ? v.trim() : ''))
        .filter((v: string) => v.length > 0)
        .filter((v: string) => SN_RE.test(v) && !UNIT_TAIL_RE.test(v));
      if (cleaned.length) {
        idsField = {
          value: cleaned,
          confidence: this.clampConfidence(idsRaw.confidence),
        };
      }
    }
    return {
      measurementIds: idsField,
      inverterMakeModel: this.strField(parsed.inverterMakeModel),
      reasoning:
        typeof parsed.reasoning === 'string' ? parsed.reasoning : '',
    };
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
      `  - measurementIds: opportunistic — if the COD proof includes an equipment list with inverter / meter serial numbers, extract them as a string[]. Empty/null if no SN list is present.`,
      ``,
      `Strict JSON, no markdown, no prose:`,
      `{`,
      `  "commissioningDate": {"value": <string|null>, "confidence": <0..1>},`,
      `  "facilityName": {"value": <string|null>, "confidence": <0..1>},`,
      `  "acCapacityKw": {"value": <number|null>, "confidence": <0..1>},`,
      `  "ownerName": {"value": <string|null>, "confidence": <0..1>},`,
      `  "utilityOrIssuer": {"value": <string|null>, "confidence": <0..1>},`,
      `  "measurementIds": {"value": <string[]|null>, "confidence": <0..1>},`,
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
    let measurementIds: ExtractedField<string[]> | undefined;
    const idsRaw = parsed?.measurementIds;
    if (idsRaw && Array.isArray(idsRaw.value) && idsRaw.value.length) {
      const cleaned = idsRaw.value
        .map((v: any) => (typeof v === 'string' ? v.trim() : ''))
        .filter((v: string) => v.length > 0);
      if (cleaned.length) {
        measurementIds = {
          value: cleaned,
          confidence: this.clampConfidence(idsRaw.confidence),
        };
      }
    }
    return {
      commissioningDate: this.strField(parsed.commissioningDate),
      facilityName: this.strField(parsed.facilityName),
      acCapacityKw: this.numField(parsed.acCapacityKw),
      ownerName: this.strField(parsed.ownerName),
      utilityOrIssuer: this.strField(parsed.utilityOrIssuer),
      measurementIds,
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
      `  - networkOwner: the DSO / electricity DISTRIBUTION COMPANY that owns the grid the facility connects to. This is the utility (e.g. "Eko Disco", "AEDC", "Eskom", "ECG"), NOT the project sponsor / EPC / developer / off-taker. Look in the "Grid Connection" or "Network Operator" section. Return null if no DSO is named.`,
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
      `  "networkOwner": {"value": <string|null>, "confidence": <0..1>},`,
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
      networkOwner: this.strField(parsed.networkOwner),
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
      contentHash?: string;
    },
    apiKey: string,
    ctx: { userId?: number; organizationId?: number; deviceId?: number },
    promptInstructions: string,
  ): Promise<any> {
    const cached = await this.cacheLookup(input.contentHash, endpoint);
    if (cached) {
      void this.auditCacheHit(endpoint, ctx);
      this.logger.log(`${endpoint}: cache hit`);
      return cached;
    }
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
      void this.cacheStore(input.contentHash, endpoint, parsed);
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

  /** When the model returned a make/model string but no per-unit
   *  capacity, try to parse the kW out of the model number itself.
   *  Covers the major inverter vendors. Confidence is conservative
   *  (0.7 cap) since model-number decoding can be ambiguous. */
  private deriveInverterCapacityFromModel(
    result: ExtractSldFieldsResult,
  ): ExtractSldFieldsResult {
    if (result.inverterCapacityKw) return result;
    const model = result.inverterMakeModel?.value;
    if (!model) return result;
    // Patterns: SUN2000-30KTL, GW50K-MT, SE10K, SG110CX, etc.
    // Look for a number followed by K/KTL/CX (case-insensitive).
    const m = model.match(/(\d{1,4})\s*(?:K(?:TL|CX|HT|MT|HV|XB|SG)?|kW)\b/i);
    if (m) {
      const kw = parseInt(m[1], 10);
      if (kw >= 1 && kw <= 5000) {
        result.inverterCapacityKw = {
          value: kw,
          confidence: Math.min(
            (result.inverterMakeModel?.confidence ?? 0.7) * 0.9,
            0.7,
          ),
        };
      }
    }
    return result;
  }

  private deriveAcCapacityIfMissing(
    result: ExtractSldFieldsResult,
  ): ExtractSldFieldsResult {
    if (result.acCapacityKw) return result;
    const cnt = result.inverterCount?.value;
    const each = result.inverterCapacityKw?.value;
    if (typeof cnt === 'number' && typeof each === 'number' && cnt > 0 && each > 0) {
      const cConf = result.inverterCount?.confidence ?? 0.5;
      const eConf = result.inverterCapacityKw?.confidence ?? 0.5;
      // Derived value: take the lower of the two source confidences,
      // shaded down by 10% so the conflict resolver still favours an
      // explicitly-labelled nameplate when one is present.
      result.acCapacityKw = {
        value: Math.round(cnt * each * 100) / 100,
        confidence: Math.max(0, Math.min(cConf, eConf) * 0.9),
      };
    }
    return result;
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
