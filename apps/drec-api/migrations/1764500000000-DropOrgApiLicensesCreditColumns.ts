import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropOrgApiLicensesCreditColumns1764500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "org_api_licenses"
        DROP COLUMN IF EXISTS "roboflow_credits_remaining",
        DROP COLUMN IF EXISTS "deepl_credits_remaining",
        DROP COLUMN IF EXISTS "anthropic_credits_remaining"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "org_api_licenses"
        ADD COLUMN IF NOT EXISTS "roboflow_credits_remaining"  INTEGER NOT NULL DEFAULT 3,
        ADD COLUMN IF NOT EXISTS "deepl_credits_remaining"     INTEGER NOT NULL DEFAULT 3,
        ADD COLUMN IF NOT EXISTS "anthropic_credits_remaining" INTEGER NOT NULL DEFAULT 50
    `);
  }
}
