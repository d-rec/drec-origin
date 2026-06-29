import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Track when a device's coordinates have been visually confirmed via
 * successful Roboflow panel detection. The auto-screen "lat/lng has
 * ≥6 decimals" check passes if a confirmation exists at the current
 * coords, so legacy low-precision devices that genuinely sit on real
 * panels stop failing review.
 *
 * Set by the registrant flow (edit-device's panel-detect) — never by
 * reviewers (per "reviewer modifies nothing" rule).
 */
export class AddCoordsConfirmation1763100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "device"
        ADD COLUMN IF NOT EXISTS "coords_confirmed_at" TIMESTAMP NULL,
        ADD COLUMN IF NOT EXISTS "coords_confirmed_lat" DOUBLE PRECISION NULL,
        ADD COLUMN IF NOT EXISTS "coords_confirmed_lng" DOUBLE PRECISION NULL,
        ADD COLUMN IF NOT EXISTS "coords_confirmed_panel_count" INTEGER NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "device"
        DROP COLUMN IF EXISTS "coords_confirmed_at",
        DROP COLUMN IF EXISTS "coords_confirmed_lat",
        DROP COLUMN IF EXISTS "coords_confirmed_lng",
        DROP COLUMN IF EXISTS "coords_confirmed_panel_count"
    `);
  }
}
