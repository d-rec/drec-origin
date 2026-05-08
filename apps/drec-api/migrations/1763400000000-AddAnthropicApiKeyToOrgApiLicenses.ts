import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds Anthropic (Claude) API key + credit counter to org_api_licenses,
 * mirroring the existing roboflow / deepl pattern. Reviewers / Admin
 * orgs use the platform key with no cap; registrants get a small free
 * grant and can drop in their own key for unlimited use.
 */
export class AddAnthropicApiKeyToOrgApiLicenses1763400000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "org_api_licenses"
        ADD COLUMN IF NOT EXISTS "anthropic_api_key" TEXT NULL,
        ADD COLUMN IF NOT EXISTS "anthropic_credits_remaining" INTEGER NOT NULL DEFAULT 50
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "org_api_licenses"
        DROP COLUMN IF EXISTS "anthropic_credits_remaining",
        DROP COLUMN IF EXISTS "anthropic_api_key"
    `);
  }
}
