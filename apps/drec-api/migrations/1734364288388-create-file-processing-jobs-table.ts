import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFileProcessingJobsTable1734364288388
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE file_processing_status AS ENUM ('Added', 'InProgress', 'Completed', 'Failed');
      CREATE TYPE file_processing_type AS ENUM ('MeterRead', 'DeviceCreation');
      
      CREATE TABLE "file_processing_jobs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "fileId" varchar NOT NULL,
        "jobId" varchar NOT NULL,
        "userId" integer NOT NULL,
        "organizationId" integer NOT NULL,
        "status" file_processing_status NOT NULL,
        "type" file_processing_type NOT NULL,
        "apiUserId" varchar DEFAULT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE "file_processing_jobs";
      DROP TYPE file_processing_status;
      DROP TYPE file_processing_type;
    `);
  }
}
