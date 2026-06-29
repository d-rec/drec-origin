import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add a stable, non-guessable UUID to verification_reports so the share
 * URL we send to registrants doesn't expose a sequential integer (and
 * survives reseeds/exports/imports).
 */
export class AddVerificationReportUuid1762700000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`
      ALTER TABLE "verification_reports"
        ADD COLUMN IF NOT EXISTS "uuid" UUID NOT NULL DEFAULT uuid_generate_v4();
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS
        "uq_verification_reports_uuid"
        ON "verification_reports"("uuid");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "uq_verification_reports_uuid"`,
    );
    await queryRunner.query(
      `ALTER TABLE "verification_reports" DROP COLUMN IF EXISTS "uuid"`,
    );
  }
}
