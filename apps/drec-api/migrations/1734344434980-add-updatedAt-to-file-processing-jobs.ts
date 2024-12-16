import { MigrationInterface, QueryRunner } from "typeorm";

export class addUpdatedAtToFileProcessingJobs1644534501509 implements MigrationInterface {
  name = 'addUpdatedAtToFileProcessingJobs1644534501509';

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
