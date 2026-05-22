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
    'Meter readings, energy generation data, kWh/MWh production reports, monthly generation logs, screenshots of inverter/logger portals. Excel/CSV monthly reports with daily PV(kWh) / Sell(kWh) / Buy(kWh) columns are METERING_EVIDENCE — common filename patterns: "MM_YYYY_Plant_…xls", "Plant_…_Monthly_Report.xlsx", "<plantName>_<YYYY>_<MM>.csv"',
  SINGLE_LINE_DIAGRAM:
    'Electrical single-line diagram (SLD) — schematic showing inverter, transformer, breakers, busbars, AC/DC disconnects, grid connection',
  PROJECT_PHOTOS:
    'Photographs (JPEG/PNG/HEIC) of the physical site, panels on roof or ground, installation evidence. NEVER an Excel/CSV/spreadsheet — those go to METERING_EVIDENCE if they hold meter readings, otherwise OTHER_DOCUMENTS',
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
  /** Site name to filter on when the cert lists multiple facilities
   *  (Provisional Acceptance Certificates etc.). Extractor picks the
   *  row whose name matches; without this it averages / sums / picks
   *  arbitrary rows on multi-site docs. */
  siteName?: string;
}

export interface ExtractCodFieldsResult {
  commissioningDate?: ExtractedField<string>;
  facilityName?: ExtractedField<string>;
  acCapacityKw?: ExtractedField<number>;
  ownerName?: ExtractedField<string>;
  utilityOrIssuer?: ExtractedField<string>;
  country?: ExtractedField<string>;
  stateProvince?: ExtractedField<string>;
  offTakerName?: ExtractedField<string>;
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
  ownerStateProvince?: ExtractedField<string>;
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
  ownerStateProvince?: ExtractedField<string>;
  signingDate?: ExtractedField<string>;
  signatoryName?: ExtractedField<string>;
  signatoryEmail?: ExtractedField<string>;
  reasoning: string;
}

export interface VerifyOdTemplateInput {
  filename: string;
  text?: string;
  images?: Array<{
    base64: string;
    mimeType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
  }>;
  contentHash?: string;
}

export interface VerifyOdTemplateResult {
  /** 0..1 — semantic similarity to the canonical 3 clauses. */
  matchScore: number;
  /** Per-clause judgment. severity: ok | warn | fail. */
  deviations: Array<{
    clause: 'attribute_grant' | 'distinctness' | 'ownership_assigned';
    severity: 'ok' | 'warn' | 'fail';
    note: string;
  }>;
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
  /** Optional region pointer into the source document — page index
   *  (1-based) and a normalised bounding box (each value 0..1, where
   *  the page is treated as 1x1). Lets the UI highlight the exact
   *  location the model claims to have read the value from, so the
   *  registrant can visually confirm before accepting the extraction
   *  as evidence. Absent when the model didn't return a region
   *  (older cache hits, or extractors not yet wired). */
  region?: {
    page: number;
    x: number;
    y: number;
    w: number;
    h: number;
  };
  /** One-line justification — what specifically in the doc the model
   *  used to derive this value. Essential for boolean / derived /
   *  semantic fields where there's no literal token to point at
   *  (e.g. "I see a 'ZERO EXPORT SMART METER' label below the
   *  busbar, which indicates a network meter is installed"). The
   *  verify dialog shows this alongside the bbox so the registrant
   *  can scan the diagram for the actual basis even when the box is
   *  approximate. */
  reasoning?: string;
}

export interface ClassifySourceAccessModeInput {
  filename: string;
  /** 1..4 base64-encoded page images. Same envelope as the SLD
   *  extractor — registrants typically upload metering evidence as
   *  screenshots, exported PDFs, or photos of paper readings, all of
   *  which the UI rasterises to base64 PNGs before posting. */
  images: Array<{
    base64: string;
    mimeType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
  }>;
  text?: string;
  contentHash?: string;
}

/** Haiku's guess at the SourceAccessMode for a given metering-evidence
 *  document. Intentionally a *suggestion* with confidence — the UI
 *  surfaces this in the review workflow as "AI suggests Mode 2 (60%);
 *  apply / change / dismiss" and never auto-writes the field. Mode 4
 *  (compensating controls) is a reviewer judgment about process, not
 *  a document property, so the prompt explicitly refuses to suggest
 *  it — Haiku returns null+reasoning for that case instead. */
export interface ClassifySourceAccessModeResult {
  /** One of the enum *keys* (Mode1_DirectAPI / Mode2_PortalAccess /
   *  Mode3_FileSubmission) or null when the evidence shape doesn't
   *  map cleanly to one mode. */
  suggestedMode: ExtractedField<string>;
  /** Human-readable description of what the document looks like
   *  ("logged-in screenshot of Solis Cloud portal", "CSV export with
   *  Trina source-system header", "hand-compiled monthly readings
   *  spreadsheet"). Surfaced in the UI under the suggestion. */
  evidenceShape: ExtractedField<string>;
  /** One short sentence explaining why this evidence shape implies
   *  the suggested mode. */
  reasoning: string;
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
  networkOwner?: ExtractedField<string>;
  hasNetworkMeter?: ExtractedField<boolean>;
  gridExportType?: ExtractedField<string>;
  hasAuxiliaryEnergySources?: ExtractedField<boolean>;
  auxiliaryEnergySourceDetails?: ExtractedField<string>;
  hasCaptiveConsumer?: ExtractedField<boolean>;
  reasoning: string;
}

// Anthropic Haiku 4.5 pricing as of 2026-05. Use for budget tracking.
// Input: $1/Mtok, Output: $5/Mtok.
const PRICE_INPUT_PER_MTOK = 1.0;
const PRICE_OUTPUT_PER_MTOK = 5.0;

// Roboflow serverless workflow inference (cloud), 2026-05: ~$0.005 / call.
const PRICE_ROBOFLOW_PER_CALL = 0.005;

// DeepL Pro API, 2026-05: €20 / 1M characters → ~$22 / 1M chars.
// Note: ai_audit_log.input_tokens stores character_count for DeepL rows
// (the entity reuses the column — see ai-audit-log.entity.ts line 13).
const PRICE_DEEPL_PER_MCHAR_USD = 22.0;

function costAnthropic(inT: number, outT: number): number {
  return Number(
    (
      (inT * PRICE_INPUT_PER_MTOK + outT * PRICE_OUTPUT_PER_MTOK) /
      1_000_000
    ).toFixed(4),
  );
}

function costRoboflow(calls: number): number {
  return Number((calls * PRICE_ROBOFLOW_PER_CALL).toFixed(4));
}

function costDeepl(chars: number): number {
  return Number(((chars * PRICE_DEEPL_PER_MCHAR_USD) / 1_000_000).toFixed(4));
}

function costFor(
  provider: string,
  calls: number,
  inT: number,
  outT: number,
): number {
  if (provider === 'anthropic') return costAnthropic(inT, outT);
  if (provider === 'roboflow') return costRoboflow(calls);
  if (provider === 'deepl') return costDeepl(inT);
  return 0;
}

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

  /** Per-endpoint prompt version. Bump when the extractor's prompt
   *  text materially changes — the cache key is composed as
   *  `<endpoint>:v<N>` so old entries are silently bypassed without
   *  needing a manual DELETE FROM ai_response_cache. */
  private static readonly PROMPT_VERSIONS: Record<string, number> = {
    'classify-document': 2,        // bumped 2026-05-14 — METERING_EVIDENCE / PROJECT_PHOTOS descriptions tightened on Excel reports
    'extract-sld-fields': 8,        // bumped 2026-05-21 — per-field reasoning ("what in the doc justifies this value")
    'extract-sf02-fields': 5,       // bumped 2026-05-21 — per-field region + reasoning (Phase 2)
    'extract-sf02c-fields': 4,      // bumped 2026-05-21 — per-field region + reasoning (Phase 2)
    'extract-cod-fields': 5,        // bumped 2026-05-22 — siteName filter for multi-site certs
    'extract-meter-ids-fields': 1,
    'classify-source-access-mode': 1,
    'verify-od-template': 1,
  };

  /**
   * Canonical SF-02C Owner's Declaration boilerplate — only the
   * three substantive clauses (declaration of attribute generation,
   * distinctness, granting of permission). Letterhead, addressing,
   * date, and signature are excluded so a customised to-address or
   * alternate signatory line doesn't false-flag.
   */
  private static readonly OD_TEMPLATE_CLAUSES = [
    'Please accept this letter as granting [Registrant organisation name] the exclusive right to act in respect of trading all renewable and environmental attributes generated from the operation of our renewable electricity production facility.',
    'We understand that the attributes associated with renewable electricity generation are different and distinct from instruments that may be granted by other certification schemes for the same generation, including but not limited to carbon credits, tax credits, and other environmental commodities.',
    'In granting this permission we accept that the ownership of the associated renewable and carbon attributes from the generation of electricity at our production facility resides solely with the Registrant for the duration of this declaration, and we shall not assign, transfer, sell, or otherwise dispose of these attributes to any other party.',
  ];

  /** Compose the cache key. Endpoint name keeps the canonical form
   *  for audit logging; only the cache uses the versioned key. */
  private versionedKey(endpoint: string): string {
    const v = AiService.PROMPT_VERSIONS[endpoint] ?? 1;
    return `${endpoint}:v${v}`;
  }

  /** Look up a previously-stored response by content hash + endpoint.
   *  Returns null on miss or if the row is older than CACHE_TTL_DAYS. */
  private async cacheLookup(
    contentHash: string | undefined,
    endpoint: string,
  ): Promise<any | null> {
    if (!contentHash) return null;
    const row = await this.cache.findOne({
      where: { contentHash, endpoint: this.versionedKey(endpoint) },
    });
    if (!row) return null;
    const ageMs = Date.now() - new Date(row.createdAt).getTime();
    if (ageMs > AiService.CACHE_TTL_DAYS * 86400 * 1000) return null;
    return row.response;
  }

  /** Drop any ExtractedField entry whose confidence is below the
   *  threshold (default 0.5). Below half-confidence is "the model is
   *  guessing" — and a guess that gets the right answer is
   *  indistinguishable from a hallucination that happens to be
   *  plausible. We'd rather the downstream see `undefined` and prompt
   *  a human to type the value than show an AI-fabricated string with
   *  a confidence sticker that lulls reviewers into trusting it.
   *
   *  Mutates and returns the same object. `reasoning` and any
   *  non-ExtractedField properties are left intact. */
  private scrubLowConfidence<T extends Record<string, any>>(
    result: T,
    minConfidence = 0.5,
  ): T {
    if (!result || typeof result !== 'object') return result;
    for (const key of Object.keys(result)) {
      const v = (result as any)[key];
      // ExtractedField is shaped { value, confidence } — anything else
      // (reasoning string, deviations array, matchScore number) stays.
      if (
        v &&
        typeof v === 'object' &&
        !Array.isArray(v) &&
        typeof v.confidence === 'number' &&
        'value' in v
      ) {
        if ((v.confidence ?? 0) < minConfidence) {
          delete (result as any)[key];
        }
      }
    }
    return result;
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
        [contentHash, this.versionedKey(endpoint), JSON.stringify(response)],
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
    byProvider: Array<{
      provider: string;
      calls: number;
      inputTokens: number;
      outputTokens: number;
      successRate: number;
      estimatedUsd: number;
    }>;
    daily: Array<{ day: string; calls: number; estimatedUsd: number }>;
    topOrgs: Array<{
      organizationId: number | null;
      organizationName: string | null;
      calls: number;
      estimatedUsd: number;
    }>;
  }> {
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const monthIso = monthStart.toISOString();

    // Anthropic-only token rollups (used for byEndpoint / daily slices and
    // for the Anthropic share of the month-to-date dollar total).
    const totalsAnthropic = await this.audit
      .createQueryBuilder('a')
      .select('COUNT(*)', 'calls')
      .addSelect('COALESCE(SUM(a.input_tokens), 0)', 'inputTokens')
      .addSelect('COALESCE(SUM(a.output_tokens), 0)', 'outputTokens')
      .addSelect(
        'COALESCE(SUM(CASE WHEN a.success THEN 1 ELSE 0 END), 0)',
        'successes',
      )
      .where('a.created_at >= :since', { since: monthIso })
      .andWhere("a.provider = 'anthropic'")
      .getRawOne();

    const calls = Number(totalsAnthropic?.calls ?? 0);
    const inputTokens = Number(totalsAnthropic?.inputTokens ?? 0);
    const outputTokens = Number(totalsAnthropic?.outputTokens ?? 0);
    const successes = Number(totalsAnthropic?.successes ?? 0);

    const byEndpointRows = await this.audit
      .createQueryBuilder('a')
      .select('a.endpoint', 'endpoint')
      .addSelect('COUNT(*)', 'calls')
      .addSelect('COALESCE(SUM(a.input_tokens), 0)', 'inputTokens')
      .addSelect('COALESCE(SUM(a.output_tokens), 0)', 'outputTokens')
      .where('a.created_at >= :since', { since: monthIso })
      .andWhere("a.provider = 'anthropic'")
      .groupBy('a.endpoint')
      .orderBy('"calls"', 'DESC')
      .getRawMany();

    const byProviderRows = await this.audit
      .createQueryBuilder('a')
      .select('a.provider', 'provider')
      .addSelect('COUNT(*)', 'calls')
      .addSelect('COALESCE(SUM(a.input_tokens), 0)', 'inputTokens')
      .addSelect('COALESCE(SUM(a.output_tokens), 0)', 'outputTokens')
      .addSelect(
        'COALESCE(SUM(CASE WHEN a.success THEN 1 ELSE 0 END), 0)',
        'successes',
      )
      .where('a.created_at >= :since', { since: monthIso })
      .groupBy('a.provider')
      .orderBy('"calls"', 'DESC')
      .getRawMany();

    const dailyRows = await this.audit
      .createQueryBuilder('a')
      .select("to_char(a.created_at, 'YYYY-MM-DD')", 'day')
      .addSelect('COUNT(*)', 'calls')
      .addSelect('COALESCE(SUM(a.input_tokens), 0)', 'inputTokens')
      .addSelect('COALESCE(SUM(a.output_tokens), 0)', 'outputTokens')
      .where("a.created_at >= now() - INTERVAL '30 days'")
      .andWhere("a.provider = 'anthropic'")
      .groupBy("to_char(a.created_at, 'YYYY-MM-DD')")
      .orderBy('"day"', 'ASC')
      .getRawMany();

    const topOrgRows = await this.audit
      .createQueryBuilder('a')
      .select('a.organization_id', 'organizationId')
      .addSelect('o.name', 'organizationName')
      .addSelect('COUNT(*)', 'calls')
      .addSelect('COALESCE(SUM(a.input_tokens), 0)', 'inputTokens')
      .addSelect('COALESCE(SUM(a.output_tokens), 0)', 'outputTokens')
      .leftJoin('organization', 'o', 'o.id = a.organization_id')
      .where('a.created_at >= :since', { since: monthIso })
      .andWhere("a.provider = 'anthropic'")
      .groupBy('a.organization_id')
      .addGroupBy('o.name')
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

    const byProvider = byProviderRows.map((r) => {
      const c = Number(r.calls);
      const s = Number(r.successes);
      const inT = Number(r.inputTokens);
      const outT = Number(r.outputTokens);
      return {
        provider: r.provider,
        calls: c,
        inputTokens: inT,
        outputTokens: outT,
        successRate: c ? Number((s / c).toFixed(3)) : 1,
        estimatedUsd: costFor(r.provider, c, inT, outT),
      };
    });

    // monthToDate is Anthropic-only — it powers the Haiku gauge / donut /
    // byEndpoint slices on the AI Usage page. Roboflow + DeepL spend lives
    // on byProvider[] (each row carries its own estimatedUsd).
    return {
      monthToDate: {
        calls,
        inputTokens,
        outputTokens,
        estimatedUsd: costAnthropic(inputTokens, outputTokens),
        successRate: calls ? Number((successes / calls).toFixed(3)) : 1,
      },
      byEndpoint: byEndpointRows.map((r) => ({
        endpoint: r.endpoint,
        calls: Number(r.calls),
        inputTokens: Number(r.inputTokens),
        outputTokens: Number(r.outputTokens),
        estimatedUsd: costAnthropic(
          Number(r.inputTokens),
          Number(r.outputTokens),
        ),
      })),
      byProvider,
      daily: dailyRows.map((r) => ({
        day: r.day,
        calls: Number(r.calls),
        estimatedUsd: costAnthropic(
          Number(r.inputTokens),
          Number(r.outputTokens),
        ),
      })),
      topOrgs: topOrgRows.map((r) => ({
        organizationId: r.organizationId == null ? null : Number(r.organizationId),
        organizationName: r.organizationName ?? null,
        calls: Number(r.calls),
        estimatedUsd: costAnthropic(
          Number(r.inputTokens),
          Number(r.outputTokens),
        ),
      })),
    };
  }

  /**
   * Per-org usage rollup for the current month, scoped to non-Anthropic
   * paid providers (Roboflow + DeepL). Used by the registrant Licenses
   * page so a customer with their own API key can see their own usage.
   */
  async getMyProviderUsage(organizationId: number): Promise<{
    roboflow: { calls: number; successRate: number };
    deepl: { calls: number; successRate: number; characterCount: number };
  }> {
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const monthIso = monthStart.toISOString();

    const rows = await this.audit
      .createQueryBuilder('a')
      .select('a.provider', 'provider')
      .addSelect('COUNT(*)', 'calls')
      .addSelect('COALESCE(SUM(a.input_tokens), 0)', 'inputTokens')
      .addSelect(
        'COALESCE(SUM(CASE WHEN a.success THEN 1 ELSE 0 END), 0)',
        'successes',
      )
      .where('a.created_at >= :since', { since: monthIso })
      .andWhere('a.organization_id = :org', { org: organizationId })
      .andWhere("a.provider IN ('roboflow', 'deepl')")
      .groupBy('a.provider')
      .getRawMany();

    const pull = (provider: 'roboflow' | 'deepl') => {
      const r = rows.find((x) => x.provider === provider);
      const calls = Number(r?.calls ?? 0);
      const successes = Number(r?.successes ?? 0);
      return {
        calls,
        successRate: calls ? Number((successes / calls).toFixed(3)) : 1,
        inputTokens: Number(r?.inputTokens ?? 0),
      };
    };
    const rf = pull('roboflow');
    const dl = pull('deepl');
    return {
      roboflow: { calls: rf.calls, successRate: rf.successRate },
      deepl: {
        calls: dl.calls,
        successRate: dl.successRate,
        characterCount: dl.inputTokens,
      },
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
   * Suggest a SourceAccessMode by looking at the metering-evidence
   * document. The mode itself is a process/contract decision about
   * how DREC obtains readings, not strictly extractable from any
   * document — but in practice the *shape* of the evidence almost
   * always implies one mode:
   *
   *   - portal screenshot (logged-in dashboard, time-series chart,
   *     vendor UI chrome) → Mode 2 — portal access
   *   - API response payload / Swagger / curl transcript / structured
   *     JSON timeseries → Mode 1 — direct API
   *   - CSV/XLSX export with a vendor source-system header (deviceId,
   *     gateway hash, "Trina/Solis/Huawei FusionSolar Export") →
   *     Mode 3 — source-linked file
   *
   * The prompt deliberately *refuses* to suggest Mode 4 (compensating
   * controls) because that's a reviewer judgment about whether to
   * accept low-trust data with manual checks on top — it's never a
   * property of the document itself. Haiku returns null+reasoning
   * for that case so the reviewer sets it explicitly.
   *
   * Always a suggestion. The UI surfaces it in the auto-screen
   * panel as "apply / change / dismiss"; never auto-writes the
   * device.sourceAccessMode field.
   */
  async classifySourceAccessMode(
    input: ClassifySourceAccessModeInput,
    apiKey: string,
    ctx: { userId?: number; organizationId?: number; deviceId?: number },
  ): Promise<ClassifySourceAccessModeResult> {
    const cached = await this.cacheLookup(
      input.contentHash,
      'classify-source-access-mode',
    );
    if (cached) {
      void this.auditCacheHit('classify-source-access-mode', ctx);
      this.logger.log('classify-source-access-mode: cache hit');
      return cached as ClassifySourceAccessModeResult;
    }
    const client = new Anthropic({ apiKey });
    const prompt = [
      `You are reading a "metering evidence" document submitted as part of a renewable-energy registration. The registrant is showing how meter readings will be sourced for periodic certificate issuance. Classify the document into ONE of three source-access modes by looking at its visual / textual shape.`,
      ``,
      `Modes you can suggest:`,
      ``,
      `  "Mode1_DirectAPI"     — the document shows or implies that DREC will pull readings via a vendor API. Signals: a JSON / XML payload printout, a Swagger / OpenAPI screenshot, a curl-style request transcript, structured timeseries data with explicit API field names (deviceId, ts, kwh, …), or an API key / endpoint URL.`,
      ``,
      `  "Mode2_PortalAccess"  — the document shows DREC (or a DREC operator) logging into a vendor's monitoring portal to read values. Signals: a logged-in dashboard screenshot, the chrome of a vendor UI (Solis Cloud, Huawei FusionSolar, SMA Sunny Portal, Solar-Log, Solar Edge monitoring, Trina, Enphase Enlighten), a time-series chart inside a browser window with a sidebar / nav / user-profile widget, OR a screenshot of a single browser tab whose URL bar references a known monitoring vendor.`,
      ``,
      `  "Mode3_FileSubmission" — the document is a *source-linked* file: a CSV / XLSX / PDF export that carries clear vendor source-system identifiers in its headers or filename (e.g. column names like "device_id, gateway_hash, raw_kwh", a header row like "Huawei FusionSolar Export 2026-04", a filename like "trina-rooftop-Q1-2026.csv"). The data was downloaded *from* a source system and uploaded as-is. NOT a hand-compiled spreadsheet.`,
      ``,
      `Return null for suggestedMode in these cases:`,
      ``,
      `  - The document is a hand-compiled spreadsheet with no source-system identifiers, a transcribed paper meter reading, a photo of a meter face, or any artefact whose data has been re-entered by a human. This is *candidate Mode 4 territory*, but Mode 4 is a reviewer judgment about adding compensating controls on top of low-trust data — it's not a property of the document. Set reasoning to "candidate Mode 4 — reviewer should confirm with compensating controls in mind".`,
      ``,
      `  - The document is ambiguous (could be Mode 1 or Mode 3, e.g. a clean CSV with no clear source-system header) — return null and let the reviewer pick. Set reasoning accordingly.`,
      ``,
      `  - The document isn't metering evidence at all (it's an SLD, COD, SF-02, photo of panels, etc.). Set reasoning to "not a metering evidence document".`,
      ``,
      `Respond with strict JSON only, no prose, no markdown fences:`,
      `{`,
      `  "suggestedMode":  {"value": <"Mode1_DirectAPI"|"Mode2_PortalAccess"|"Mode3_FileSubmission"|null>, "confidence": <0..1>},`,
      `  "evidenceShape":  {"value": <string|null>, "confidence": <0..1>},`,
      `  "reasoning":      "<one short sentence>"`,
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
      const textBlock =
        input.text && input.text.trim().length
          ? `\n\nText layer (use to confirm what the vision pass sees):\n"""\n${input.text.slice(0, MAX_INPUT_CHARS)}\n"""\n`
          : '';
      const res = await client.messages.create({
        model: HAIKU_MODEL,
        max_tokens: 512,
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
      const result: ClassifySourceAccessModeResult = {
        suggestedMode: {
          value: typeof parsed.suggestedMode?.value === 'string'
            ? parsed.suggestedMode.value
            : (null as any),
          confidence: Number(parsed.suggestedMode?.confidence ?? 0),
        },
        evidenceShape: {
          value: typeof parsed.evidenceShape?.value === 'string'
            ? parsed.evidenceShape.value
            : (null as any),
          confidence: Number(parsed.evidenceShape?.confidence ?? 0),
        },
        reasoning:
          typeof parsed.reasoning === 'string' ? parsed.reasoning : '',
      };
      success = true;
      void this.cacheStore(
        input.contentHash,
        'classify-source-access-mode',
        result,
      );
      return result;
    } catch (err: any) {
      errorMessage = err?.message ?? String(err);
      throw err;
    } finally {
      void this.audit
        .insert({
          endpoint: 'classify-source-access-mode',
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
        `classify-source-access-mode: ${success ? 'ok' : 'fail'} in=${inputTokens} out=${outputTokens} ${Date.now() - startedAt}ms`,
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
      return this.scrubLowConfidence(cached as ExtractSldFieldsResult);
    }
    const client = new Anthropic({ apiKey });
    const prompt = [
      `You are reading a Single Line Diagram (SLD) from a solar PV installation.`,
      ``,
      `Extract these fields from the diagram. Use null for any field you cannot read with reasonable certainty. Each field has its own 0..1 confidence.`,
      ``,
      `  - acCapacityKw: total PV-INVERTER AC-side capacity in kW (sum of the grid-tied solar inverter ratings only). DO NOT include battery / hybrid inverters that are NOT producing PV (e.g. a Victron Quattro / MultiPlus battery inverter — even when present in a hybrid system, its AC output represents stored energy, not PV generation). DO NOT include diesel / fuel generators (Mikano, Cummins, FG Wilson — even when shown in the SLD as backup). Example: an SLD with 2× HUAWEI SUN2000-30KTL-M3 PV inverters + 1× Victron Quattro 10 kVA battery inverter + 80 kVA Mikano gen-set → acCapacityKw = 60 (only the two PV inverters).`,
      `  - dcCapacityKwp: total DC-side capacity in kWp (module-side, sum of module wattages)`,
      `  - inverterCount: number of inverters`,
      `  - inverterCapacityKw: capacity of EACH inverter in kW (if mixed sizes, the most common one). Read the kW from a labelled "AC capacity" if shown, OR derive it from the model number when the manufacturer encodes it: Huawei SUN2000-30KTL-M3 = 30 kW, SUN2000-100KTL = 100 kW; Goodwe GW50K-MT = 50 kW, GW100K-HT = 100 kW; SolarEdge SE10K = 10 kW; Sungrow SG110CX = 110 kW.`,
      `  - inverterMakeModel: full manufacturer + model string as written on the diagram (e.g. "HUAWEI SUN2000-30KTL-M3", "Goodwe GW50K-MT"). Read inverter labels even when they sit alongside the inverter symbol rather than inside it.`,
      `  - moduleCount: total number of PV modules`,
      `  - moduleWattage: per-module wattage in W (e.g. 545)`,
      `  - gridVoltage: grid connection voltage as written (e.g. "400V", "11kV", "33kV")`,
      `  - gridTied: true ONLY if the SLD shows an actual utility-grid connection point — a labelled MV/HV transformer primary feeding from a utility line, a named DSO ("Eko Disco", "AEDC", "KPLC", …), or a revenue meter on the high-voltage side. Same critical distinction as networkOwner: "grid tied" / "grid-tied" appearing in a title block or near an inverter brand (HUAWEI SUN2000, SMA Sunny Boy, Fronius, Solis, …) describes the INVERTER topology, NOT a utility connection. A mini-grid with battery inverters forming the local AC bus + diesel backup + customer loads is OFF-GRID → gridTied=false, regardless of how many times the word "grid" appears on the diagram. Return false for off-grid / islanded mini-grid; true only when there is unambiguous utility connection.`,
      `  - zeroExport: true if a zero-export controller / no-export-to-grid is shown`,
      `  - transformerKva: transformer rating in kVA when shown`,
      `  - networkOwner: the DSO / electricity DISTRIBUTION COMPANY that owns the grid the facility connects to. Look at the GRID-SIDE of the diagram (utility connection point, MV/HV bus, transformer primary). The label is usually next to the grid-side bus or written as "Grid: <utility>", "Utility: <name>", "To: <DSO>", or as the utility logo. Examples: "Eko Disco", "AEDC", "Eskom", "ECG", "KPLC", "Tata Power Mumbai". This is NOT the project owner / EPC / off-taker. **CRITICAL DISTINCTION: "grid tied" or "grid-tied" appearing in the TITLE BLOCK or near a brand of inverter (HUAWEI SUN2000, SMA Sunny Boy, Fronius, Solis, etc.) describes the INVERTER topology — those inverters need an AC reference, which can be provided by a local microgrid bus (Victron Quattro, SMA Sunny Island, Schneider Conext) without any utility connection. That is NOT a grid-connected facility.** A mini-grid with battery inverters forming the AC bus + diesel backup + loads = OFF-GRID, return "n/a". The facility is grid-CONNECTED only when the SLD shows an actual utility connection point: MV/HV transformer primary feeding from a utility line, named DSO, revenue meter at a PCC, or explicit "Grid" / "Utility" bus on the high-voltage side. If the SLD shows the facility is NOT grid-connected (off-grid, islanded mini-grid with no utility connection at all), return the literal string "n/a" — the question doesn't apply. Otherwise return null only if the diagram IS grid-tied but doesn't name the DSO.`,
      `  - hasNetworkMeter: true if a meter is shown AT the utility connection point / point of common coupling (PCC). It will appear as a meter symbol (circle with "M", "kWh", or "Wh") on the GRID-SIDE of the main breaker, or labelled "Revenue Meter", "Utility Meter", "Export Meter", "Settlement Meter", "Network Meter", "PCC Meter", "Bidirectional Meter". Inverter-side meters (between PV array and inverter) and submeters DON'T count. Return false only if you can clearly see the grid connection point with no meter; null if you can't tell.`,
      `  - gridExportType: how PV power flows back to the utility grid. Pick EXACTLY one of these strings:`,
      `      "No (zero-export)"      — a zero-export controller / no-export-to-grid relay / reverse-power relay / "anti-islanding only" is shown, OR the SLD shows the inverter feeding only a local load with no path to the grid bus, OR the SLD shows a MINI-GRID topology (PV inverter → AC bus → multiple local customer loads, often with battery storage; grid connection if any is for backup IMPORT, not export). Same signal as zeroExport=true. THIS IS THE DEFAULT for mini-grids and off-grid systems.`,
      `      "Yes (partial-export)"  — a bidirectional / net-metering / "import + export" meter is EXPLICITLY drawn or labelled, OR the SLD labels the export path as "surplus only", "net metering", "behind-the-meter with export", "feed-in tariff". The site self-consumes first and exports the surplus to a UTILITY (not to local mini-grid customers). Multiple kWh meters alone are NOT enough to claim partial-export — they could be customer-side metering on a mini-grid.`,
      `      "Yes (full-export)"     — the SLD shows ALL inverter output going through a dedicated export meter to a UTILITY grid with no local-load tap (utility-scale solar farm, dedicated export PPA, "export only" label). Rare outside of utility-scale projects.`,
      `    Return null if you genuinely can't tell. When in doubt for a mini-grid or community system, prefer "No (zero-export)".`,
      ``,
      `    Worked example (Atsawa-shape mini-grid): SLD shows 2× HUAWEI PV inverters → local AC bus → battery storage (SOLARMD) + Victron Quattro battery inverter forming the AC reference + diesel backup (Mikano), with multiple customer kWh meters, no MV/HV transformer, no named DSO, and a title like "Nigeria MiniGrid" or "off-grid community". This is an off-grid mini-grid feeding local customers: gridTied=false (no utility connection point exists), networkOwner="n/a", gridExportType="No (zero-export)", hasNetworkMeter=false. The "Grid tied" wording in the title refers to the HUAWEI inverter topology, not the facility — the inverters synchronise to the local Victron AC bus, not to a utility.`,
      `  - hasAuxiliaryEnergySources: true if the SLD shows ANY non-PV power source — diesel generator (gen-set / DG / "Mikano", "Cummins", "Caterpillar", "FG Wilson"), battery storage (BESS / lithium / "SOLARMD", "BYD", "Tesla Powerwall"), wind, hydro, fuel cell. Just the inverter + grid is NOT auxiliary. Return false only when the diagram clearly shows PV-only with no storage; null if uncertain.`,
      `  - auxiliaryEnergySourceDetails: short human-readable list of what you found (e.g. "Mikano 80kVA diesel + 128.7 kWh SOLARMD lithium battery"). Null if hasAuxiliaryEnergySources is false/null.`,
      `  - hasCaptiveConsumer: true if the SLD shows ANY on-site consumption — direct loads like "TO LOAD", "TO HOUSE", "Gate house", water tank, customer meters, building loads on the LV side. A mini-grid feeding local customers IS captive consumption. False ONLY when the diagram is utility-scale export with no on-site load tap. Null when uncertain.`,
      ``,
      ``,
      `For EACH field, also include a "region" pointing to the location in the source where you read the value. The region is the 1-based page number plus a normalised bounding box where the page is treated as 1×1 (x, y = top-left corner of the box as fractions of page width/height; w, h = box width/height as fractions of page width/height). Make the box snug around the literal text/symbol/number you read. Skip the "region" field when the value is null OR when you cannot point to a specific location (e.g. derived/computed values).`,
      ``,
      `For EACH field, also include a short "reasoning" — one concise sentence naming the specific element(s) of the diagram that justify your value. Examples:`,
      `  acCapacityKw=250 → "summed from two INVERTER 3P-125kW labels"`,
      `  hasNetworkMeter=true → "ZERO EXPORT SMART METER label below the MDB-PV busbar"`,
      `  gridVoltage="400Vac" → "GRID 400Vac label at the top of the diagram"`,
      `This reasoning is shown to the registrant during verification so they can find the basis even when the bbox is approximate. Make it useful for human verification, not a generic restatement.`,
      ``,
      `Respond with strict JSON only, no prose, no markdown fences. Use null for unknown values:`,
      `{`,
      `  "acCapacityKw": {"value": <number|null>, "confidence": <0..1>, "region": {"page": 1, "x": 0..1, "y": 0..1, "w": 0..1, "h": 0..1}, "reasoning": "<one-line>"},`,
      `  "dcCapacityKwp": {"value": <number|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "inverterCount": {"value": <integer|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "inverterCapacityKw": {"value": <number|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "inverterMakeModel": {"value": <string|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "moduleCount": {"value": <integer|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "moduleWattage": {"value": <integer|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "gridVoltage": {"value": <string|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "gridTied": {"value": <boolean|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "zeroExport": {"value": <boolean|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "transformerKva": {"value": <number|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "networkOwner": {"value": <string|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "hasNetworkMeter": {"value": <boolean|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "gridExportType": {"value": <string|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "hasAuxiliaryEnergySources": {"value": <boolean|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "auxiliaryEnergySourceDetails": {"value": <string|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "hasCaptiveConsumer": {"value": <boolean|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
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
        // Bumped 2026-05-21: 1024 was tight when each ExtractedField
        // gained a region: {page, x, y, w, h} — 17 fields × ~20 tokens
        // for the region object adds ~340 tokens just for bbox JSON,
        // and 1024 truncated the response mid-array → parse fail → 500.
        max_tokens: 2048,
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
      const result = this.scrubLowConfidence(
        this.deriveAcCapacityIfMissing(
          this.deriveInverterCapacityFromModel(this.normalizeSldResult(parsed)),
        ),
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
      `  - ownerStateProvince: the state / province / region that the address sits in. For Vietnamese addresses this is the "Tỉnh" (e.g. "Ninh Thuận", "Tây Ninh", "Bình Định"); for Nigerian, the State (e.g. "Lagos"); for Kenyan, the County (e.g. "Nakuru"). Return just the place name without the "Province"/"Tỉnh"/"State"/"County" suffix. Null if the address only has a city or you can't read a province.`,
      `  - signingDate: ISO-8601 date (YYYY-MM-DD). Convert from any format on the letter.`,
      `  - signatoryName: name of the person who signed`,
      `  - signatoryEmail: email of the signatory if present`,
      ``,
      `For EACH field, also include a "region" pointing to the location in the source where you read the value: 1-based page number plus a normalised bounding box (x, y, w, h ∈ [0, 1], page treated as 1×1). Skip "region" when the value is null OR when it isn't a literal piece of text on the page.`,
      ``,
      `For EACH field, also include a short "reasoning" — one concise sentence naming the specific element(s) on the letter that justify your value (e.g. "Project name in title block, second line"). Shown to the registrant during verification.`,
      ``,
      `Respond with strict JSON only, no prose, no markdown fences. Use null for unknown values:`,
      `{`,
      `  "projectName": {"value": <string|null>, "confidence": <0..1>, "region": {"page": 1, "x": 0..1, "y": 0..1, "w": 0..1, "h": 0..1}, "reasoning": "<one-line>"},`,
      `  "ownerLegalName": {"value": <string|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "ownerAddress": {"value": <string|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "ownerCountry": {"value": <string|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "ownerStateProvince": {"value": <string|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "signingDate": {"value": <string|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "signatoryName": {"value": <string|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "signatoryEmail": {"value": <string|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
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
        // Bumped 2026-05-21 for region + reasoning per field (Phase 2).
        max_tokens: 2048,
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
      const result = this.scrubLowConfidence(this.normalizeSf02cResult(parsed));
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
   * Verify that an uploaded SF-02C Owner's Declaration carries the
   * three substantive boilerplate clauses (attribute grant,
   * distinctness, ownership-resides-with-Registrant) close to the
   * canonical wording. Letterhead, addressing, date, and signature
   * are intentionally NOT compared — registrants legitimately
   * customise those.
   */
  async verifyOdTemplate(
    input: VerifyOdTemplateInput,
    apiKey: string,
    ctx: { userId?: number; organizationId?: number; deviceId?: number },
  ): Promise<VerifyOdTemplateResult> {
    const cached = (await this.cacheLookup(
      input.contentHash,
      'verify-od-template',
    )) as VerifyOdTemplateResult | null;
    if (cached) return cached;

    const client = new Anthropic({ apiKey });
    const promptInstructions = [
      `You are verifying that an Owner's Declaration letter (I-REC SF-02C) carries the three substantive boilerplate clauses with the SAME MEANING as the canonical template. Letterhead, to-address, date, signatory name, and salutation are NOT compared — registrants legitimately customise those.`,
      ``,
      `Canonical clauses to find in the letter:`,
      ...AiService.OD_TEMPLATE_CLAUSES.map(
        (c, i) =>
          `  ${['attribute_grant', 'distinctness', 'ownership_assigned'][i]}:\n    "${c}"`,
      ),
      ``,
      `For each clause, judge:`,
      `  - "ok"   = present, semantically equivalent to canonical (small wording differences acceptable)`,
      `  - "warn" = present but has wording deviations that change scope or detail`,
      `  - "fail" = missing or materially different (e.g. excludes carbon attributes, names a different beneficiary, adds a sunset clause)`,
      ``,
      `Strict JSON only:`,
      `{`,
      `  "matchScore": <0..1 — 1.0 if all three clauses are "ok">,`,
      `  "deviations": [`,
      `    {"clause": "attribute_grant",    "severity": "ok|warn|fail", "note": "<one short sentence>"},`,
      `    {"clause": "distinctness",       "severity": "ok|warn|fail", "note": "<one short sentence>"},`,
      `    {"clause": "ownership_assigned", "severity": "ok|warn|fail", "note": "<one short sentence>"}`,
      `  ],`,
      `  "reasoning": "<one short sentence summarising overall match>"`,
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
        max_tokens: 512,
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
      const result: VerifyOdTemplateResult = {
        matchScore:
          typeof parsed.matchScore === 'number'
            ? this.clampConfidence(parsed.matchScore)
            : 0,
        deviations: Array.isArray(parsed.deviations)
          ? parsed.deviations
              .filter((d: any) => d && typeof d === 'object')
              .map((d: any) => ({
                clause: d.clause,
                severity: ['ok', 'warn', 'fail'].includes(d.severity)
                  ? d.severity
                  : 'warn',
                note: typeof d.note === 'string' ? d.note : '',
              }))
          : [],
        reasoning:
          typeof parsed.reasoning === 'string' ? parsed.reasoning : '',
      };
      success = true;
      void this.cacheStore(input.contentHash, 'verify-od-template', result);
      return result;
    } catch (err: any) {
      errorMessage = err?.message ?? String(err);
      throw err;
    } finally {
      void this.audit
        .insert({
          endpoint: 'verify-od-template',
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
        `verify-od-template: ${success ? 'ok' : 'fail'} in=${inputTokens} out=${outputTokens} ${Date.now() - startedAt}ms`,
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
    const siteFilterBlock = input.siteName
      ? [
          `**THIS COD IS BEING READ FOR A SPECIFIC SITE: "${input.siteName}"**`,
          ``,
          `If the document is a multi-site / portfolio certificate (a table listing several facilities, mini-grids, or projects), find the ROW whose facility / project / mini-grid name matches "${input.siteName}" — exact match preferred, but fuzzy is OK if there's only one plausible candidate (e.g. "Atsawa" matches "Atsawa Mini-Grid"). Extract ONLY that row's values. Ignore other rows. Ignore "total" / aggregate rows.`,
          ``,
          `If there is NO row matching "${input.siteName}" in a multi-site doc, return null for ALL fields and put "no row for ${input.siteName} found in this multi-site certificate" in the top-level reasoning field. DO NOT pick a different row or aggregate.`,
          ``,
          `If the document is a single-site cert (not a multi-row table), proceed normally — the siteName filter is moot.`,
          ``,
        ].join('\n')
      : '';
    const promptInstructions = [
      `You are reading a "Commercial Operation Date" (COD) proof — a certificate or letter from a utility / regulator / EPC stating the date the solar facility began commercial operation.`,
      ``,
      siteFilterBlock,
      `Extract these fields. Use null where unknown.`,
      `  - commissioningDate: ISO-8601 (YYYY-MM-DD)`,
      `  - facilityName: site / plant name as written`,
      `  - acCapacityKw: AC capacity in kW (convert from kVA / MW if needed)`,
      `  - ownerName: facility owner organization`,
      `  - utilityOrIssuer: who issued / signed the COD letter`,
      `  - country: country where the facility is located. Look at the address, the regulator name (NERC=Nigeria, EPRA=Kenya, NERSA=South Africa, ERC=Philippines), the utility (Eko Disco / AEDC=Nigeria, KPLC=Kenya, Eskom=South Africa), or place names. Return the full English country name (e.g. "Nigeria", "Kenya", "South Africa") or null.`,
      `  - stateProvince: the state / province / region the facility is in. Vietnamese "Tỉnh" (e.g. "Ninh Thuận", "Tây Ninh"), Nigerian State (e.g. "Lagos"), Kenyan County (e.g. "Nakuru"). Return just the place name without the "Province" / "Tỉnh" / "State" / "County" suffix. Null if the document only names a city or you can't read a province.`,
      `  - offTakerName: legal name of the electricity OFF-TAKER — the entity buying / consuming the power (e.g. a factory, a mini-grid customer association, a hospital, a captive industrial user). NOT the project owner / EPC / utility / financier. Off-takers are usually named in the recital ("...for the supply of electricity to <off-taker>") or in a dedicated "Off-taker" / "Customer" / "Buyer" field. Return null if no distinct off-taker is named.`,
      `  - measurementIds: opportunistic — if the COD proof includes an equipment list with inverter / meter serial numbers, extract them as a string[]. Empty/null if no SN list is present.`,
      ``,
      ``,
      `For EACH field, also include "region" (1-based page + normalised x/y/w/h ∈ [0,1] bbox; omit when not a literal token) and "reasoning" (one concise sentence naming the element on the document that justified the value). Shown to the registrant during verification.`,
      ``,
      `Strict JSON, no markdown, no prose:`,
      `{`,
      `  "commissioningDate": {"value": <string|null>, "confidence": <0..1>, "region": {"page": 1, "x": 0..1, "y": 0..1, "w": 0..1, "h": 0..1}, "reasoning": "<one-line>"},`,
      `  "facilityName": {"value": <string|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "acCapacityKw": {"value": <number|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "ownerName": {"value": <string|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "utilityOrIssuer": {"value": <string|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "country": {"value": <string|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "stateProvince": {"value": <string|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "offTakerName": {"value": <string|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "measurementIds": {"value": <string[]|null>, "confidence": <0..1>, "reasoning": <as above>},`,
      `  "reasoning": "<one short sentence>"`,
      `}`,
    ].join('\n');
    // Mix siteName into the cache key — two devices reading the same
    // multi-site cert with different siteName filters must NOT share
    // cached results.
    const siteSalted = input.siteName
      ? { ...input, contentHash: input.contentHash ? `${input.contentHash}#site=${input.siteName}` : undefined }
      : input;
    const parsed = await this.runDocExtraction(
      'extract-cod-fields',
      siteSalted,
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
      facilityName: this.siteNameField(parsed.facilityName),
      acCapacityKw: this.numField(parsed.acCapacityKw),
      ownerName: this.strField(parsed.ownerName),
      utilityOrIssuer: this.strField(parsed.utilityOrIssuer),
      country: this.strField(parsed.country),
      stateProvince: this.strField(parsed.stateProvince),
      offTakerName: this.strField(parsed.offTakerName),
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
      `  - ownerStateProvince: the state / province / region the address is in. Vietnamese "Tỉnh" (e.g. "Ninh Thuận"), Nigerian State, Kenyan County, etc. Return just the place name, no "Province" / "Tỉnh" / "State" / "County" suffix. Null if not present.`,
      `  - latitude: decimal degrees (positive N, negative S)`,
      `  - longitude: decimal degrees (positive E, negative W)`,
      `  - inverterCount: number of inverters`,
      `  - moduleCount: total module count`,
      `  - networkOwner: the DSO / electricity DISTRIBUTION COMPANY that owns the grid the facility connects to. This is the utility (e.g. "Eko Disco", "AEDC", "Eskom", "ECG"), NOT the project sponsor / EPC / developer / off-taker. Look in the "Grid Connection" or "Network Operator" section. **If the SF-02 indicates the facility is off-grid / not grid-connected (no DSO field, "n/a" written in, or the facility config is mini-grid / off-grid), return the literal string "n/a".** Otherwise return null only if grid-connected but the DSO field is left blank.`,
      ``,
      ``,
      `For EACH field, also include "region" (1-based page + normalised x/y/w/h ∈ [0,1] bbox; omit when not a literal token) and "reasoning" (one concise sentence naming the form section or label that justified the value).`,
      ``,
      `Strict JSON only:`,
      `{`,
      `  "facilityName": {"value": <string|null>, "confidence": <0..1>, "region": {"page": 1, "x": 0..1, "y": 0..1, "w": 0..1, "h": 0..1}, "reasoning": "<one-line>"},`,
      `  "acCapacityKw": {"value": <number|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "commissioningDate": {"value": <string|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "deviceTypeCode": {"value": <string|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "ownerLegalName": {"value": <string|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "ownerAddress": {"value": <string|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "ownerCountry": {"value": <string|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "ownerStateProvince": {"value": <string|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "latitude": {"value": <number|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "longitude": {"value": <number|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "inverterCount": {"value": <integer|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "moduleCount": {"value": <integer|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
      `  "networkOwner": {"value": <string|null>, "confidence": <0..1>, "region": <as above>, "reasoning": <as above>},`,
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
      facilityName: this.siteNameField(parsed.facilityName),
      acCapacityKw: this.numField(parsed.acCapacityKw),
      commissioningDate: this.strField(parsed.commissioningDate),
      deviceTypeCode: this.strField(parsed.deviceTypeCode),
      ownerLegalName: this.strField(parsed.ownerLegalName),
      ownerAddress: this.strField(parsed.ownerAddress),
      ownerCountry: this.strField(parsed.ownerCountry),
      ownerStateProvince: this.strField(parsed.ownerStateProvince),
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
      return this.scrubLowConfidence(cached);
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
        // Bumped 2026-05-21 for region + reasoning per field (Phase 2).
        max_tokens: 2048,
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
      const scrubbed = this.scrubLowConfidence(parsed);
      void this.cacheStore(input.contentHash, endpoint, scrubbed);
      return scrubbed;
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

  /** Generic-noun tokens that Haiku sometimes returns as a `facilityName`
   *  or `projectName` when it pulled a header phrase like "Hệ thống điện
   *  mặt trời …" / "Solar power system …" and truncated to just the
   *  leading common nouns. Strings made up entirely of these tokens
   *  aren't actually site names and would only show up as noisy
   *  low-confidence hints in the UI. Diacritics stripped before lookup. */
  private static readonly GENERIC_SITE_NAME_TOKENS = new Set([
    // English
    'system', 'systems', 'project', 'projects', 'facility', 'facilities',
    'plant', 'plants', 'site', 'sites', 'solar', 'power', 'energy', 'farm', 'pv',
    // Vietnamese (diacritics stripped: "Hệ thống" → "he thong")
    'he', 'thong', 'du', 'an', 'nha', 'may', 'dien', 'mat', 'troi',
    // Spanish / Portuguese
    'sistema', 'planta', 'proyecto', 'instalacion', 'energia',
    // French
    'systeme', 'projet', 'installation', 'centrale',
    // German
    'anlage', 'kraftwerk',
  ]);

  /** True when the extracted "site name" is just a string of generic
   *  nouns ("System", "Hệ thống điện", "Solar project") — i.e. Haiku
   *  grabbed a document header instead of a real proper-noun site name. */
  private isGenericSiteName(value: string): boolean {
    if (!value) return true;
    const normalized = value
      .toLowerCase()
      .normalize('NFD')
      // Strip combining diacritical marks so "Hệ" → "he", "Système" → "systeme"
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .trim();
    if (normalized.length <= 2) return true;
    const tokens = normalized.split(/\s+/).filter((t) => t.length > 0);
    if (tokens.length === 0) return true;
    return tokens.every((t) => AiService.GENERIC_SITE_NAME_TOKENS.has(t));
  }

  /** Like strField, but nulls out generic-noun site names so the UI
   *  doesn't show low-confidence hints for "System" / "Hệ thống". */
  private siteNameField(raw: any): ExtractedField<string> | undefined {
    const f = this.strField(raw);
    if (!f) return undefined;
    if (this.isGenericSiteName(f.value)) {
      this.logger.debug(
        `dropped generic site-name extraction: "${f.value}" (conf=${f.confidence})`,
      );
      return undefined;
    }
    return f;
  }

  private normalizeSf02cResult(parsed: any): ExtractSf02cFieldsResult {
    // Uses the class-level strField helper that carries region +
    // reasoning through (Phase 2 — surfaces in the verify queue).
    const strField = (raw: any) => this.strField(raw);
    return {
      projectName: this.siteNameField(parsed.projectName),
      ownerLegalName: strField(parsed.ownerLegalName),
      ownerAddress: strField(parsed.ownerAddress),
      ownerCountry: strField(parsed.ownerCountry),
      ownerStateProvince: strField(parsed.ownerStateProvince),
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
    const cnt = result.inverterCount?.value;
    const each = result.inverterCapacityKw?.value;
    const haveProduct =
      typeof cnt === 'number' &&
      typeof each === 'number' &&
      cnt > 0 &&
      each > 0;

    if (!result.acCapacityKw) {
      if (haveProduct) {
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

    // Sanity check: if Haiku returned both an explicit acCapacityKw
    // and the multiplier (count × per-inverter) disagrees by >10%,
    // prefer the multiplication. Catches the "Haiku added the
    // battery / gen-set to the inverter total" class of error
    // without needing a prompt tweak per new hardware vendor.
    if (haveProduct) {
      const product = Math.round(cnt * each * 100) / 100;
      const claimed = result.acCapacityKw.value;
      const drift = Math.abs(claimed - product) / Math.max(product, 1);
      if (drift > 0.10) {
        const cConf = result.inverterCount?.confidence ?? 0.5;
        const eConf = result.inverterCapacityKw?.confidence ?? 0.5;
        result.acCapacityKw = {
          value: product,
          // Lower confidence to flag the override — the conflict
          // resolver / overwrite-prompt UI surfaces this so the
          // registrant can reject if the multiplication is the wrong
          // one (mixed-size inverters).
          confidence: Math.max(0, Math.min(cConf, eConf) * 0.85),
        };
      }
    }
    return result;
  }

  // ── Shared field-shape helpers used by every normalize*Result. ──
  // Hoisted out of normalizeSldResult so the SF-02c / COD / SF-02
  // normalizers all carry region + reasoning through with the same
  // logic. Each *Field helper builds an ExtractedField<T> from the
  // model's raw {value, confidence, region?, reasoning?} object.

  /** Sanity-check the region the model returned. Page must be a
   *  positive integer; bbox numbers must each be finite and clamped
   *  to 0..1 (Haiku occasionally returns -0.01 or 1.05). Returns
   *  undefined when nothing usable is present. */
  private regionField(raw: any) {
    if (!raw || typeof raw !== 'object') return undefined;
    const r = raw.region;
    if (!r || typeof r !== 'object') return undefined;
    const page = Number(r.page);
    const x = Number(r.x);
    const y = Number(r.y);
    const w = Number(r.w);
    const h = Number(r.h);
    if (
      !Number.isFinite(page) ||
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(w) ||
      !Number.isFinite(h)
    ) {
      return undefined;
    }
    const clamp = (n: number) => Math.max(0, Math.min(1, n));
    return {
      page: Math.max(1, Math.floor(page)),
      x: clamp(x),
      y: clamp(y),
      w: clamp(w),
      h: clamp(h),
    };
  }

  /** Attach region + reasoning to a base ExtractedField when the
   *  raw input provided them. Both are optional; absent metadata
   *  doesn't break the base shape. */
  private withRegion<T>(
    base: ExtractedField<T> | undefined,
    raw: any,
  ): ExtractedField<T> | undefined {
    if (!base) return base;
    const region = this.regionField(raw);
    const reasoning =
      raw && typeof raw.reasoning === 'string' && raw.reasoning.trim()
        ? raw.reasoning.trim()
        : undefined;
    const extras: Partial<ExtractedField<T>> = {};
    if (region) extras.region = region;
    if (reasoning) extras.reasoning = reasoning;
    return Object.keys(extras).length ? { ...base, ...extras } : base;
  }

  /** Number-typed ExtractedField with region + reasoning carry-through. */
  private numField(raw: any): ExtractedField<number> | undefined {
    if (!raw || raw.value === null || raw.value === undefined) return undefined;
    const v = typeof raw.value === 'number' ? raw.value : parseFloat(raw.value);
    if (!isFinite(v)) return undefined;
    return this.withRegion(
      { value: v, confidence: this.clampConfidence(raw.confidence) },
      raw,
    );
  }

  /** String-typed ExtractedField with region + reasoning carry-through. */
  private strField(raw: any): ExtractedField<string> | undefined {
    if (!raw || !raw.value) return undefined;
    return this.withRegion(
      {
        value: String(raw.value),
        confidence: this.clampConfidence(raw.confidence),
      },
      raw,
    );
  }

  /** Boolean-typed ExtractedField with region + reasoning carry-through. */
  private boolFieldCommon(
    raw: any,
  ): ExtractedField<boolean> | undefined {
    if (!raw || raw.value === null || raw.value === undefined) return undefined;
    return this.withRegion(
      {
        value: Boolean(raw.value),
        confidence: this.clampConfidence(raw.confidence),
      },
      raw,
    );
  }

  private normalizeSldResult(parsed: any): ExtractSldFieldsResult {
    const numField = (raw: any) => this.numField(raw);
    const strField = (raw: any) => this.strField(raw);
    const boolField = (raw: any) => this.boolFieldCommon(raw);
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
      networkOwner: strField(parsed.networkOwner),
      hasNetworkMeter: boolField(parsed.hasNetworkMeter),
      gridExportType: strField(parsed.gridExportType),
      hasAuxiliaryEnergySources: boolField(parsed.hasAuxiliaryEnergySources),
      auxiliaryEnergySourceDetails: strField(parsed.auxiliaryEnergySourceDetails),
      hasCaptiveConsumer: boolField(parsed.hasCaptiveConsumer),
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
