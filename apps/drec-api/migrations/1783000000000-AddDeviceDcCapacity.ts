import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add `dc_capacity` to `device`. Splits the overloaded `capacity` column:
 * `capacity` stays the AC nameplate (what the UI form collects and what the
 * GCC production report + registry export show), while `dc_capacity` holds the
 * DC nameplate (kWp) that the Solar GSA yield model and production-ceiling check
 * require. Nullable and populated going forward only — the ceiling reads
 * `dc_capacity ?? capacity` (see utils/get-dc-capacity), so a null value
 * reproduces the historical behaviour exactly.
 */
export class AddDeviceDcCapacity1783000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "device"
        ADD COLUMN IF NOT EXISTS "dc_capacity" double precision NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "device"
        DROP COLUMN IF EXISTS "dc_capacity"
    `);
  }
}
