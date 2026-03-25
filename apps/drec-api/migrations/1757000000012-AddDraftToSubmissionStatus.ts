import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDraftToSubmissionStatus1757000000012
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "submission_status_enum" ADD VALUE IF NOT EXISTS 'draft' BEFORE 'pending'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Postgres doesn't support removing values from enums easily;
    // convert any 'draft' rows back to 'pending' as a safe fallback.
    await queryRunner.query(`
      UPDATE submissions SET status = 'pending' WHERE status = 'draft'
    `);
  }
}
