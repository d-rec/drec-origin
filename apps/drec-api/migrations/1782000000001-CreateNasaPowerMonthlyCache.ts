import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Cache table for NASA POWER monthly ALLSKY_SFC_SW_DWN values.
 *
 * One row per (rounded-lat, rounded-lon, year). POWER's grid is
 * ~0.5°; storing latQ = round(lat*10) keeps the PK integer and
 * still preserves more than the satellite resolution warrants.
 */
export class CreateNasaPowerMonthlyCache1782000000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "nasa_power_monthly_cache" (
        "lat_q" INT NOT NULL,
        "lon_q" INT NOT NULL,
        "year" INT NOT NULL,
        "ghi_kwh_m2_day" JSONB NOT NULL,
        "fetched_at" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("lat_q", "lon_q", "year")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "nasa_power_monthly_cache";`);
  }
}
