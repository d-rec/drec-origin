import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The 1763900000000 backfill stamped every populated field on every
 * pre-provenance device with a "(backfill)" source at confidence 0.5,
 * based purely on which doc types were attached — NOT on whether the
 * doc actually contained the value. That produced concrete false
 * attributions (e.g. siteName="Peter site" credited to a SF-02c that
 * doesn't contain the string at all, serial numbers credited to
 * "Meter IDs (backfill)" with no value list to check).
 *
 * 1764100000000 already dropped misattributed `address` entries.
 * This migration generalises: drop ANY field whose source ends in
 * "(backfill)" AND whose confidence is below 0.70. That matches the
 * UI's apply-extraction threshold and the field-provenance-backfill
 * service's new 0.70 floor — so the persisted provenance is honest
 * by the same bar the live extraction path uses.
 *
 * Session-recorded provenance (no "(backfill)" suffix) is preserved
 * regardless of confidence — the user actively accepted those.
 */
export class DropAllLowConfidenceBackfillProvenance1779000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Two-pass UPDATE: filter the JSONB to drop keys where source
    // ends with "(backfill)" AND confidence < 0.7, then NULLIF an
    // empty object back to NULL so the next-edit UI doesn't see
    // `{}` and assume "no entries to backfill" when there really
    // are none worth keeping.
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
                WHERE NOT (
                  v->>'source' LIKE '%(backfill)'
                  AND (v->>'confidence')::numeric < 0.7
                )
              ),
              '{}'::jsonb
            ),
            '{}'::jsonb
          ) AS kept
        FROM device d2
        WHERE d2.field_provenance IS NOT NULL
      ) AS sub
      WHERE d.id = sub.id;
    `);
  }

  public async down(): Promise<void> {
    // No-op. The dropped entries were synthetic heuristics from
    // 1763900000000 — re-running that migration would re-create
    // them on devices with NULL field_provenance, which is the
    // intended forward path if a deployment ever needs them back.
  }
}
