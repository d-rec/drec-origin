import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { FileService } from '../file/file.service';
import { DocumentType } from '../document-uploads/entities/documents.entity';

/**
 * Backfill `device.field_provenance` for devices whose values were
 * AI-assisted at registration time but whose provenance entries never
 * landed in the DB — usually because the SLD extractor returned the
 * same value the registrant had already typed, so the old UI code path
 * silently skipped recordProvenance.
 *
 * This service re-runs the relevant extractor against the device's
 * uploaded documents server-side (no UI involvement) and patches
 * provenance for any field where the extractor confirms the current
 * device value. Existing provenance entries are NEVER overwritten —
 * the operation is purely additive, so it's safe to re-run.
 *
 * Current scope: SLD only. The other doc-type extractors follow the
 * same template; left for follow-up commits as the need arises.
 *
 * Cost: one Haiku call per SLD document. With only 2 prod sites
 * carrying documents today, the total spend is < $0.01.
 */
@Injectable()
export class FieldProvenanceBackfillService {
  private readonly logger = new Logger(FieldProvenanceBackfillService.name);

  constructor(
    @InjectDataSource() private readonly connection: DataSource,
    private readonly fileService: FileService,
  ) {}

  /** Re-run the SLD extractor for a single device, patching
   *  field_provenance for value-matches. Returns a summary of what
   *  changed so the caller can verify. */
  async backfillFromSld(
    deviceId: number,
    anthropicKey: string,
  ): Promise<{
    deviceId: number;
    documentsProcessed: number;
    fieldsPatched: string[];
    fieldsSkippedNoMatch: string[];
    fieldsSkippedAlreadyHaveProvenance: string[];
    errors: string[];
  }> {
    const deviceRows: any[] = await this.connection.query(
      `SELECT id, "gridInterconnection",
              capacity,
              interconnection_voltage  AS "interconnectionVoltage",
              network_owner            AS "networkOwner",
              has_network_meter        AS "hasNetworkMeter",
              grid_export_type         AS "gridExportType",
              has_auxiliary_energy_sources    AS "hasAuxiliaryEnergySources",
              auxiliary_energy_source_details AS "auxiliaryEnergySourceDetails",
              has_captive_consumer     AS "hasCaptiveConsumer",
              field_provenance         AS "fieldProvenance",
              "siteName"
       FROM device WHERE id = $1`,
      [deviceId],
    );
    if (deviceRows.length === 0) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }
    const device = deviceRows[0];
    const existingProvenance: Record<string, any> =
      device.fieldProvenance ?? {};

    const docs: Array<{ url: string; type: string }> = await this.connection
      .query(
        `SELECT url, type FROM documents
         WHERE target_id = $1 AND target_type = 'device'
           AND type = $2
         ORDER BY created_at DESC`,
        [String(deviceId), DocumentType.SINGLE_LINE_DIAGRAM],
      );

    const result = {
      deviceId,
      documentsProcessed: 0,
      fieldsPatched: [] as string[],
      fieldsSkippedNoMatch: [] as string[],
      fieldsSkippedAlreadyHaveProvenance: [] as string[],
      errors: [] as string[],
    };

    if (docs.length === 0) {
      this.logger.log(
        `Device ${deviceId} (${device.siteName}): no SLD documents found`,
      );
      return result;
    }

    // The fields the SLD extractor knows about, mapped to the device's
    // current column values. Keep in sync with extractSldFields in
    // ai.service.ts.
    const fieldMap: Record<string, { current: any; transform?: (v: any) => any }> = {
      gridInterconnection: { current: device.gridInterconnection, transform: (v) => !!v },
      capacity:            { current: device.capacity != null ? Number(device.capacity) : null },
      interconnectionVoltage: { current: device.interconnectionVoltage },
      networkOwner:        { current: device.networkOwner },
      hasNetworkMeter:     { current: device.hasNetworkMeter, transform: (v) => (v ? 'Yes' : 'No') },
      gridExportType:      { current: device.gridExportType },
      hasAuxiliaryEnergySources: { current: device.hasAuxiliaryEnergySources, transform: (v) => (v ? 'Yes' : 'No') },
      auxiliaryEnergySourceDetails: { current: device.auxiliaryEnergySourceDetails },
      hasCaptiveConsumer:  { current: device.hasCaptiveConsumer, transform: (v) => (v ? 'Yes' : 'No') },
    };

    const client = new Anthropic({ apiKey: anthropicKey });

    for (const doc of docs) {
      try {
        const s3Key = this.extractS3Key(doc.url);
        const s3Object: any = await this.fileService.getUploadS3(s3Key);
        const body = s3Object?.data?.Body;
        if (!body) {
          result.errors.push(`SLD ${doc.url}: empty S3 body`);
          continue;
        }
        const pdfBase64 = Buffer.isBuffer(body)
          ? body.toString('base64')
          : Buffer.from(body).toString('base64');

        const extracted = await this.runSldExtractor(client, pdfBase64);
        result.documentsProcessed++;

        for (const [fieldName, mapping] of Object.entries(fieldMap)) {
          if (existingProvenance[fieldName]) {
            // Don't overwrite an existing provenance entry — it may
            // carry information the backfill can't reproduce (e.g.
            // a different doc type that also extracted this field).
            result.fieldsSkippedAlreadyHaveProvenance.push(fieldName);
            continue;
          }
          const extractedField = extracted[fieldName];
          if (
            !extractedField ||
            extractedField.value == null ||
            (extractedField.confidence ?? 0) < 0.5
          ) {
            continue;
          }
          const extractedValue = mapping.transform
            ? mapping.transform(extractedField.value)
            : extractedField.value;
          if (!this.valuesMatch(mapping.current, extractedValue)) {
            result.fieldsSkippedNoMatch.push(fieldName);
            continue;
          }
          existingProvenance[fieldName] = {
            source: 'SLD',
            confidence: extractedField.confidence,
            at: new Date().toISOString(),
            value: extractedValue,
            backfilled: true,
          };
          result.fieldsPatched.push(fieldName);
        }
      } catch (err: any) {
        const msg = err?.message ?? String(err);
        this.logger.error(`Backfill SLD ${doc.url} failed: ${msg}`);
        result.errors.push(`SLD ${doc.url}: ${msg}`);
      }
    }

    if (result.fieldsPatched.length > 0) {
      await this.connection.query(
        `UPDATE device SET field_provenance = $1::jsonb WHERE id = $2`,
        [JSON.stringify(existingProvenance), deviceId],
      );
      this.logger.log(
        `Device ${deviceId} (${device.siteName}): patched ${result.fieldsPatched.length} field(s): ${result.fieldsPatched.join(', ')}`,
      );
    }

    return result;
  }

  /** Trimmed copy of extractSldFields's prompt — kept self-contained
   *  so the backfill service doesn't depend on AiService internals.
   *  When the prompt in ai.service.ts evolves, this one needs the
   *  same bump (no auto-sync; backfill is a one-off operation). */
  private async runSldExtractor(
    client: Anthropic,
    pdfBase64: string,
  ): Promise<Record<string, { value: any; confidence: number }>> {
    const prompt = [
      'You are reading a Single Line Diagram (SLD) from a solar PV installation.',
      '',
      'Extract these fields. Use null for any field you cannot read with reasonable certainty. Each field has its own 0..1 confidence.',
      '',
      '  - capacity: total PV-INVERTER AC-side capacity in kW',
      '  - interconnectionVoltage: grid connection voltage as written (e.g. "400V", "11kV", "33kV")',
      '  - gridInterconnection: true ONLY if the SLD shows an actual utility-grid connection point — labelled MV/HV transformer primary from a utility line, named DSO, or revenue meter on the high-voltage side. Off-grid / mini-grid → false.',
      '  - networkOwner: the DSO / distribution company that owns the grid the facility connects to. Use "n/a" when off-grid.',
      '  - hasNetworkMeter: true if a meter is shown AT the utility connection point / PCC.',
      '  - gridExportType: one of "No (zero-export)", "Yes (partial-export)", "Yes (full-export)". Mini-grids default to "No (zero-export)".',
      '  - hasAuxiliaryEnergySources: true if SLD shows any non-PV power source (diesel gen-set, battery, wind, hydro).',
      '  - auxiliaryEnergySourceDetails: short list (e.g. "Mikano 80kVA diesel + 128.7 kWh battery"). Null if none.',
      '  - hasCaptiveConsumer: true if SLD shows on-site consumption (loads, customer meters, building loads).',
      '',
      'Respond with strict JSON only, no prose, no markdown fences:',
      '{',
      '  "capacity":               {"value": <number|null>, "confidence": <0..1>},',
      '  "interconnectionVoltage": {"value": <string|null>, "confidence": <0..1>},',
      '  "gridInterconnection":    {"value": <boolean|null>, "confidence": <0..1>},',
      '  "networkOwner":           {"value": <string|null>, "confidence": <0..1>},',
      '  "hasNetworkMeter":        {"value": <boolean|null>, "confidence": <0..1>},',
      '  "gridExportType":         {"value": <string|null>, "confidence": <0..1>},',
      '  "hasAuxiliaryEnergySources":     {"value": <boolean|null>, "confidence": <0..1>},',
      '  "auxiliaryEnergySourceDetails":  {"value": <string|null>, "confidence": <0..1>},',
      '  "hasCaptiveConsumer":     {"value": <boolean|null>, "confidence": <0..1>}',
      '}',
    ].join('\n');

    const res = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdfBase64,
              },
            } as any,
            { type: 'text', text: prompt },
          ],
        },
      ],
    });

    const block = res.content.find((c) => c.type === 'text') as
      | { type: 'text'; text: string }
      | undefined;
    const raw = block?.text?.trim() ?? '';
    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    if (jsonStart < 0 || jsonEnd < 0) {
      throw new Error(`Model returned unparseable response: ${raw.slice(0, 200)}`);
    }
    return JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
  }

  /** Pulls the S3 object key out of either a full URL or a bare key. */
  private extractS3Key(urlOrKey: string): string {
    if (!urlOrKey.startsWith('http')) return urlOrKey;
    try {
      const u = new URL(urlOrKey);
      return u.pathname.replace(/^\//, '');
    } catch {
      return urlOrKey;
    }
  }

  /** Lenient value-equality. Booleans, numbers (with float fuzz),
   *  case-insensitive trimmed strings. Returns false on any null
   *  side to avoid claiming a match against a null. */
  private valuesMatch(a: any, b: any): boolean {
    if (a == null || b == null) return false;
    if (typeof a === 'boolean' || typeof b === 'boolean') {
      return Boolean(a) === Boolean(b);
    }
    if (typeof a === 'number' && typeof b === 'number') {
      return Math.abs(a - b) < 0.01;
    }
    return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
  }
}
