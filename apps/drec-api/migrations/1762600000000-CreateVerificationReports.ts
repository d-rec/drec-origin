import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Persist verification (Verify Device) reports so reviewers can share a
 * stable URL with registrants. Each row is one full run of the verify
 * checks: aggregate metadata + the per-section subItems are stuffed in a
 * jsonb payload so we don't have to ALTER on every new check we add.
 */
export class CreateVerificationReports1762600000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "verification_reports" (
        "id" SERIAL PRIMARY KEY,
        "device_id" INTEGER NOT NULL REFERENCES "device"("id") ON DELETE CASCADE,
        "created_by_email" VARCHAR(255) NOT NULL,
        "created_by_name" VARCHAR(255),
        "elapsed_ms" INTEGER NOT NULL DEFAULT 0,
        "overall_status" VARCHAR(16),
        "payload" JSONB NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS "idx_verification_reports_device_id"
        ON "verification_reports"("device_id", "created_at" DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "verification_reports"`);
  }
}
