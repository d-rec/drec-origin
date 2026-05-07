import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drop the platform-wide 2000 kWh/kW/yr default that pre-dated the
 * Solar GSA / irradiance ceiling. The constant has been removed from
 * the codebase; this migration:
 *
 *   1. Nulls existing rows where yieldValue = 2000 (cargo-culted
 *      defaults — every device in the dev DB carries this value with
 *      no rows ever set explicitly).
 *   2. Drops the column-level DEFAULT 2000 so new devices land with NULL
 *      unless the registrant sets it explicitly.
 *   3. Makes the column nullable.
 */
export class ClearLegacyYieldDefault1762800000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "device" SET "yieldValue" = NULL WHERE "yieldValue" = 2000;
    `);
    await queryRunner.query(`
      ALTER TABLE "device" ALTER COLUMN "yieldValue" DROP DEFAULT;
    `);
    await queryRunner.query(`
      ALTER TABLE "device" ALTER COLUMN "yieldValue" DROP NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "device" ALTER COLUMN "yieldValue" SET DEFAULT 2000;
    `);
    await queryRunner.query(`
      UPDATE "device" SET "yieldValue" = 2000 WHERE "yieldValue" IS NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE "device" ALTER COLUMN "yieldValue" SET NOT NULL;
    `);
  }
}
