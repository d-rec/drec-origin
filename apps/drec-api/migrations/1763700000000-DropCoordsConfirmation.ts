import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drop the coords_confirmed_* columns added by 1763100000000.
 *
 * Background: those columns existed only to satisfy the auto-screen
 * "≥6-decimal precision" check — when panel detection succeeded
 * visually, the columns let the device pass the precision rule even
 * with low-decimal lat/lng. The precision check itself was removed
 * (verify-dialog drop, then submit-side drop), so these columns are
 * now dead weight. Drop them to clean up the schema.
 */
export class DropCoordsConfirmation1763700000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "device"
        DROP COLUMN IF EXISTS "coords_confirmed_at",
        DROP COLUMN IF EXISTS "coords_confirmed_lat",
        DROP COLUMN IF EXISTS "coords_confirmed_lng",
        DROP COLUMN IF EXISTS "coords_confirmed_panel_count"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "device"
        ADD COLUMN IF NOT EXISTS "coords_confirmed_at" TIMESTAMP NULL,
        ADD COLUMN IF NOT EXISTS "coords_confirmed_lat" DOUBLE PRECISION NULL,
        ADD COLUMN IF NOT EXISTS "coords_confirmed_lng" DOUBLE PRECISION NULL,
        ADD COLUMN IF NOT EXISTS "coords_confirmed_panel_count" INTEGER NULL
    `);
  }
}
