import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOperatingConfigurationToDevice1757000000018
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "device"
      ADD COLUMN IF NOT EXISTS "operatingConfiguration" varchar NULL
    `);

    // Backfill: gridInterconnection = false → Off-grid / islanded.
    // gridInterconnection = true is ambiguous (could be any grid-connected
    // config), so those are left NULL for manual selection.
    await queryRunner.query(`
      UPDATE "device"
      SET "operatingConfiguration" = 'Off-grid / islanded'
      WHERE "gridInterconnection" = false
        AND "operatingConfiguration" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "device"
      DROP COLUMN IF EXISTS "operatingConfiguration"
    `);
  }
}
