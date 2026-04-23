import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrgApiLicenses1759900200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "org_api_licenses" (
        "id"                          SERIAL PRIMARY KEY,
        "organization_id"             INTEGER NOT NULL UNIQUE,
        "roboflow_api_key"            TEXT,
        "deepl_api_key"               TEXT,
        "roboflow_credits_remaining"  INTEGER NOT NULL DEFAULT 3,
        "deepl_credits_remaining"     INTEGER NOT NULL DEFAULT 3,
        "created_at"                  TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"                  TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "fk_org_api_licenses_organization"
          FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE
      );

      -- Backfill existing organizations
      INSERT INTO "org_api_licenses" ("organization_id")
      SELECT id FROM "organization"
      WHERE id NOT IN (SELECT "organization_id" FROM "org_api_licenses");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "org_api_licenses"`);
  }
}
