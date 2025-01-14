import { MigrationInterface, QueryRunner } from 'typeorm';

export class createBulkUploadFailedLogs1736414685134
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "bulk_upload_failed_logs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "bulkUploadId" varchar NOT NULL,
        "errorDetails" json NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE "bulk_upload_failed_logs"
    `);
  }
}
