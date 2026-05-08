import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAiAuditLog1763300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ai_audit_log" (
        "id" SERIAL PRIMARY KEY,
        "endpoint" TEXT NOT NULL,
        "model" TEXT NOT NULL,
        "input_tokens" INTEGER NOT NULL DEFAULT 0,
        "output_tokens" INTEGER NOT NULL DEFAULT 0,
        "organization_id" INTEGER NULL,
        "user_id" INTEGER NULL,
        "device_id" INTEGER NULL,
        "success" BOOLEAN NOT NULL DEFAULT TRUE,
        "error_message" TEXT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_audit_log_created_at" ON "ai_audit_log" ("created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_audit_log_endpoint" ON "ai_audit_log" ("endpoint")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "ai_audit_log"`);
  }
}
