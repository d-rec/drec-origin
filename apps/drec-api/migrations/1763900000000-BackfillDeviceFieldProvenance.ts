import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Backfill `device.field_provenance` for rows that pre-date the
 * provenance-recording UI. We can't recover the actual extraction
 * timestamps, so this is a low-confidence "(backfill)" inference:
 * for each device, look at which doc types are attached and credit
 * the populated form fields to the most-specific source whose doc
 * exists on that device.
 *
 * Source-priority per field mirrors which extractor's data we'd
 * trust most when multiple could have produced it (e.g. siteName
 * from SF-02c beats SF-02 beats COD; capacity from SLD beats SF-02).
 *
 * Skips devices that already have a non-null field_provenance
 * (UI-session writes are authoritative).
 */
export class BackfillDeviceFieldProvenance1763900000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    type DocType =
      | 'SINGLE_LINE_DIAGRAM'
      | 'SF_02C'
      | 'COD_PROOF'
      | 'FORM_SF_02'
      | 'METERING_EVIDENCE';

    const SOURCE_LABEL: Record<DocType, string> = {
      SINGLE_LINE_DIAGRAM: 'SLD',
      SF_02C: 'SF-02c',
      COD_PROOF: 'COD',
      FORM_SF_02: 'SF-02',
      METERING_EVIDENCE: 'Meter IDs',
    };

    // For each form field, ordered list of doc types that could have
    // produced it — first match wins. Mirrors the apply* methods in
    // add-devices.component.ts (collectExtractionClaims).
    const FIELD_SOURCES: Record<string, DocType[]> = {
      siteName: ['SF_02C', 'FORM_SF_02', 'COD_PROOF'],
      pvSystemOwner: ['SF_02C', 'FORM_SF_02', 'COD_PROOF'],
      address: ['SF_02C', 'FORM_SF_02'],
      countryCodename: ['SF_02C', 'FORM_SF_02', 'COD_PROOF'],
      commissioningDate: ['COD_PROOF', 'FORM_SF_02'],
      capacity: ['SINGLE_LINE_DIAGRAM', 'FORM_SF_02', 'COD_PROOF'],
      generatingUnitCount: ['SINGLE_LINE_DIAGRAM', 'FORM_SF_02'],
      networkOwner: ['FORM_SF_02', 'SINGLE_LINE_DIAGRAM'],
      latitude: ['FORM_SF_02'],
      longitude: ['FORM_SF_02'],
      deviceTypeCode: ['FORM_SF_02'],
      interconnectionVoltage: ['SINGLE_LINE_DIAGRAM'],
      gridInterconnection: ['SINGLE_LINE_DIAGRAM'],
      dataSourceBrand: ['SINGLE_LINE_DIAGRAM'],
      hasNetworkMeter: ['SINGLE_LINE_DIAGRAM'],
      gridExportType: ['SINGLE_LINE_DIAGRAM'],
      hasAuxiliaryEnergySources: ['SINGLE_LINE_DIAGRAM'],
      auxiliaryEnergySourceDetails: ['SINGLE_LINE_DIAGRAM'],
      serialNumber: ['METERING_EVIDENCE'],
    };

    // Map device entity column → JSON form-field key. Most match 1:1;
    // a few use snake_case in the DB and camelCase in form/provenance.
    // The provenance JSON keys mirror the form control names so the
    // UI fallback in collectExtractionClaims finds them as-is.
    const FIELD_DB_COLUMN: Record<string, string> = {
      siteName: 'siteName',
      pvSystemOwner: 'pv_system_owner',
      address: 'address',
      countryCodename: 'countryCode',
      commissioningDate: 'commissioningDate',
      capacity: 'capacity',
      generatingUnitCount: 'generating_unit_count',
      networkOwner: 'network_owner',
      latitude: 'latitude',
      longitude: 'longitude',
      deviceTypeCode: 'deviceTypeCode',
      interconnectionVoltage: 'interconnection_voltage',
      gridInterconnection: 'gridInterconnection',
      dataSourceBrand: 'data_source_brand',
      hasNetworkMeter: 'has_network_meter',
      gridExportType: 'grid_export_type',
      hasAuxiliaryEnergySources: 'has_auxiliary_energy_sources',
      auxiliaryEnergySourceDetails: 'auxiliary_energy_source_details',
      serialNumber: 'serial_number',
    };

    // One round-trip pulls everything we need.
    const rows: Array<{
      device_id: number;
      doc_types: DocType[] | null;
      field_values: Record<string, unknown>;
    }> = await queryRunner.query(`
      SELECT
        d.id AS device_id,
        (
          SELECT array_agg(DISTINCT doc.type)
          FROM documents doc
          WHERE doc.target_type = 'device' AND doc.target_id = d.id
        ) AS doc_types,
        to_jsonb(d) AS field_values
      FROM device d
      WHERE d.field_provenance IS NULL
    `);

    const at = new Date().toISOString();
    let updated = 0;
    let stamped = 0;

    for (const row of rows) {
      const docs = new Set(row.doc_types ?? []);
      if (docs.size === 0) continue;

      const provenance: Record<
        string,
        { source: string; confidence: number; at: string }
      > = {};

      for (const [field, sources] of Object.entries(FIELD_SOURCES)) {
        const dbCol = FIELD_DB_COLUMN[field];
        const v = (row.field_values as any)[dbCol];
        const isEmpty =
          v === null ||
          v === undefined ||
          v === '' ||
          (Array.isArray(v) && v.length === 0);
        if (isEmpty) continue;

        const winner = sources.find((s) => docs.has(s));
        if (!winner) continue;

        provenance[field] = {
          source: `${SOURCE_LABEL[winner]} (backfill)`,
          confidence: 0.5,
          at,
        };
        stamped++;
      }

      if (Object.keys(provenance).length === 0) continue;

      await queryRunner.query(
        `UPDATE device SET field_provenance = $1::jsonb WHERE id = $2`,
        [JSON.stringify(provenance), row.device_id],
      );
      updated++;
    }

    // eslint-disable-next-line no-console
    console.log(
      `[BackfillDeviceFieldProvenance] stamped ${stamped} field(s) across ${updated} device(s)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Wipe only the (backfill)-flavoured entries — leave session-
    // recorded provenance intact. jsonb_object_agg over jsonb_each
    // filters out the keys whose .source ends with "(backfill)".
    await queryRunner.query(`
      UPDATE device d
      SET field_provenance = sub.kept
      FROM (
        SELECT
          d2.id,
          NULLIF(
            COALESCE(
              (
                SELECT jsonb_object_agg(k, v)
                FROM jsonb_each(d2.field_provenance) AS j(k, v)
                WHERE NOT (v->>'source' LIKE '%(backfill)')
              ),
              '{}'::jsonb
            ),
            '{}'::jsonb
          ) AS kept
        FROM device d2
        WHERE d2.field_provenance IS NOT NULL
      ) AS sub
      WHERE d.id = sub.id
    `);
  }
}
