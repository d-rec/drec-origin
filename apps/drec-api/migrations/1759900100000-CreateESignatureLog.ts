import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateESignatureLog1759900100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "e_signature_log" (
        "id"                  SERIAL PRIMARY KEY,
        "user_id"             INTEGER NOT NULL,
        "user_email"          VARCHAR(255) NOT NULL,
        "organization_id"     INTEGER,
        "action"              VARCHAR(50) NOT NULL,
        "consent_text"        TEXT NOT NULL,
        "consent_version"     VARCHAR(20) NOT NULL DEFAULT '1.0',
        "document_hash"       VARCHAR(64),
        "device_id"           INTEGER,
        "device_external_id"  VARCHAR(255),
        "ip_address"          VARCHAR(45),
        "user_agent"          TEXT,
        "browser_fingerprint" VARCHAR(64),
        "screen_resolution"   VARCHAR(20),
        "timezone"            VARCHAR(60),
        "language"            VARCHAR(10),
        "metadata"            JSONB,
        "signed_at"           TIMESTAMPTZ NOT NULL DEFAULT now(),
        "created_at"          TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX "idx_esig_user_id" ON "e_signature_log" ("user_id");
      CREATE INDEX "idx_esig_device_id" ON "e_signature_log" ("device_id");
      CREATE INDEX "idx_esig_signed_at" ON "e_signature_log" ("signed_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "e_signature_log"`);
  }
}
