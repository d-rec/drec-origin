import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drop the legacy `yieldValue` column from `device`. It was a holdover
 * from PR #10 of the original Energy Web Foundation Origin codebase
 * (2021), used by computeMaxEnergyCapacity to enforce a per-read ceiling
 * with a global 2000 kWh/kW/yr default. The D-REC verify-device layer
 * now drives the production-ceiling check from Solar GSA / irradiance,
 * so the column has no remaining consumers.
 */
export class DropDeviceYieldValue1762900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "device" DROP COLUMN IF EXISTS "yieldValue";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reinstate as nullable (no global default — the legacy 2000 was
    // junk data that we don't want to recreate).
    await queryRunner.query(`
      ALTER TABLE "device" ADD COLUMN IF NOT EXISTS "yieldValue" INTEGER NULL;
    `);
  }
}
