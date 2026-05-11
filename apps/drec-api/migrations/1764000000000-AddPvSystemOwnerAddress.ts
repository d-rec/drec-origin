import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add `pv_system_owner_address` to `device`. Captures the registrant /
 * PV-system-owner's mailing address (the value Haiku extracts as
 * SF-02 / SF-02c `ownerAddress`). Previously that value was being
 * mis-mapped onto form field (16) "Address" — which is the device's
 * site address, not the owner's HQ — and tripping false DISAGREES
 * WITH DOCS flags on the provenance report.
 */
export class AddPvSystemOwnerAddress1764000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "device"
        ADD COLUMN IF NOT EXISTS "pv_system_owner_address" varchar NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "device"
        DROP COLUMN IF EXISTS "pv_system_owner_address"
    `);
  }
}
