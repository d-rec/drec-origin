import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add `provider` to `ai_audit_log` so the same table can record calls
 * to Anthropic, Roboflow and DeepL. Existing rows are all Anthropic.
 */
export class AddAiAuditProvider1764400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "ai_audit_log"
        ADD COLUMN IF NOT EXISTS "provider" text NOT NULL DEFAULT 'anthropic'
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "ai_audit_log_provider_created_at_idx"
        ON "ai_audit_log" ("provider", "created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "ai_audit_log_provider_created_at_idx"
    `);
    await queryRunner.query(`
      ALTER TABLE "ai_audit_log" DROP COLUMN IF EXISTS "provider"
    `);
  }
}
