import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBulkUploadTable1734364288388 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE bulk_upload_status AS ENUM ('Added', 'InProgress', 'Completed', 'Failed');
      CREATE TYPE bulk_upload_type AS ENUM ('Reads', 'Devices');
      
      CREATE TABLE "bulk_uploads" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "file_id" varchar NOT NULL,
        "job_id" varchar NOT NULL,
        "organization_id" integer NOT NULL,
        "status" bulk_upload_status NOT NULL,
        "type" bulk_upload_type NOT NULL,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE "bulk_upload";
      DROP TYPE bulk_upload_status;
      DROP TYPE bulk_upload_type;
    `);
  }
}
