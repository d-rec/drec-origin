import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drop the legacy yield-config infrastructure:
 *   - the `yieldconfig` table (per-country fallback yields)
 *   - the `device_group.yieldValue` column
 *
 * Both were holdovers from the EWF Origin codebase. The location-aware
 * Solar GSA / irradiance ceiling at the device-reviews layer is now the
 * canonical production-ceiling check; per-country and per-group yields
 * have no remaining consumers (see drec-api commit removing
 * YieldConfigModule + device_group.yieldValue references).
 */
export class DropYieldConfig1763000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "yieldconfig";`);
    await queryRunner.query(`
      ALTER TABLE "device_group" DROP COLUMN IF EXISTS "yieldValue";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reinstate column with the prior default (1000); leave yieldconfig
    // table un-recreated — its rows were per-country reference data
    // that we don't have a reliable source to backfill from.
    await queryRunner.query(`
      ALTER TABLE "device_group"
        ADD COLUMN IF NOT EXISTS "yieldValue" INTEGER NOT NULL DEFAULT 1000;
    `);
  }
}
