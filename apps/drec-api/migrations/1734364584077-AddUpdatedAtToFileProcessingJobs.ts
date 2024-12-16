import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUpdatedAtToFileProcessingJobs1734364584077
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "file_processing_jobs"
      ADD COLUMN "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "file_processing_jobs"
      DROP COLUMN "updatedAt"
    `);
  }
}
