import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Wipe EVERY field_provenance entry whose source ends in "(backfill)",
 * regardless of confidence. The earlier 1779000000000 only dropped
 * sub-0.7 entries on the theory that high-confidence backfill matches
 * might still be useful; in practice the original 1763900000000
 * migration only ever wrote at 0.5, so the 1779 cleanup already
 * handles all real-world cases. This migration formalises that:
 * NO (backfill) entries survive, period.
 *
 * Rationale: the 1763900000000 backfill was a heuristic-only
 * "this device has a SF-02c attached, so credit field X to it" with
 * no content verification and no per-id docName. Every surprise we've
 * chased in the provenance UI traces back to those entries
 * masquerading as real attribution. Wiping them entirely makes the
 * UI's invariants easier to reason about: if a field has provenance,
 * it came from a UI apply path or a real-content backfill (with a
 * value match), not from doc-presence inference.
 *
 * Session-recorded provenance — no "(backfill)" suffix — survives.
 */
export class DropAllBackfillProvenance1780000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
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
      WHERE d.id = sub.id;
    `);
  }

  public async down(): Promise<void> {
    // No-op. The dropped entries were heuristic-only stamps that
    // the UI has been wrong to trust; we don't want them back.
    // If a future need ever arises to re-attribute pre-provenance
    // devices, the right path is a new content-verifying backfill
    // (matching the field-provenance-backfill.service.ts pattern),
    // not re-running 1763900000000.
  }
}
