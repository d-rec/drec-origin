import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The 1763900000000 backfill stamped `address` with "SF-02c (backfill)"
 * or "SF-02 (backfill)" — but SF-02 / SF-02c only ever capture the
 * owner's mailing address, never the device's site address (form
 * field 16). That credit was wrong: the site address was typed by
 * the registrant. Newer code routes SF-02/SF-02c ownerAddress to a
 * dedicated pvSystemOwnerAddress column instead.
 *
 * Strip the bad `address` entries so re-saved provenance reports
 * stop attributing the site address to a doc that never claimed it.
 */
export class DropMisattributedAddressProvenance1764100000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE device d
      SET field_provenance = NULLIF(
        COALESCE(
          (
            SELECT jsonb_object_agg(k, v)
            FROM jsonb_each(d.field_provenance) AS j(k, v)
            WHERE k <> 'address'
              OR NOT (v->>'source' LIKE 'SF-02%(backfill)%')
          ),
          '{}'::jsonb
        ),
        '{}'::jsonb
      )
      WHERE field_provenance IS NOT NULL
        AND field_provenance ? 'address'
        AND field_provenance->'address'->>'source' LIKE 'SF-02%(backfill)%'
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No-op: the backfill itself is the source of truth and can be
    // re-run if needed.
  }
}
