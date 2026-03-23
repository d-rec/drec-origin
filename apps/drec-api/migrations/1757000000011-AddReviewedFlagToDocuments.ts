import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReviewedFlagToDocuments1757000000011
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "documents"
      ADD COLUMN IF NOT EXISTS "reviewed_flag" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "documents"
      DROP COLUMN IF EXISTS "reviewed_flag"
    `);
  }
}
