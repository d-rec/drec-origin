import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add `field_provenance` JSONB to `device` so we can remember which
 * extractor (SLD / SF-02 / SF-02c / COD / GEOCODER / ...) populated
 * each persisted field. Without this, on re-edit any saved value
 * looks "MANUAL" because the live extraction arrays are empty.
 *
 * Shape: { [fieldName]: { source: string, confidence: number, at: ISO8601 } }
 */
export class AddDeviceFieldProvenance1763800000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "device"
        ADD COLUMN IF NOT EXISTS "field_provenance" jsonb NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "device"
        DROP COLUMN IF EXISTS "field_provenance"
    `);
  }
}
