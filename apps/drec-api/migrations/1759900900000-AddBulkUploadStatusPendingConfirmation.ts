import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBulkUploadStatusPendingConfirmation1759900900000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new values to the bulk_upload_status enum so the two-stage
    // bulk upload flow can stage a preview before import.
    await queryRunner.query(
      `ALTER TYPE "bulk_upload_status" ADD VALUE IF NOT EXISTS 'PendingConfirmation'`,
    );
    await queryRunner.query(
      `ALTER TYPE "bulk_upload_status" ADD VALUE IF NOT EXISTS 'Importing'`,
    );
  }

  public async down(): Promise<void> {
    // Postgres does not support removing values from an enum type.
    // Leaving the values in place is safe since they are additive.
  }
}
