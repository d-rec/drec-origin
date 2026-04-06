import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContentHashToBulkUploads1759990000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bulk_uploads" ADD COLUMN IF NOT EXISTS "content_hash" VARCHAR NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bulk_uploads" DROP COLUMN IF EXISTS "content_hash"`,
    );
  }
}
