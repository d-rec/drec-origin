import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogTable1757000000024 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_log" (
        "id" SERIAL PRIMARY KEY,
        "device_id" integer NOT NULL,
        "action_type" varchar NOT NULL,
        "detail" text,
        "performed_by" varchar NOT NULL,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_audit_log_device_id" ON "audit_log" ("device_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_audit_log_created_at" ON "audit_log" ("created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_log"`);
  }
}
