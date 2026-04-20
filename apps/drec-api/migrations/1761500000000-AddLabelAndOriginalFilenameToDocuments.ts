import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLabelAndOriginalFilenameToDocuments1761500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE documents
      ADD COLUMN IF NOT EXISTS label VARCHAR NULL,
      ADD COLUMN IF NOT EXISTS original_filename VARCHAR NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE documents
      DROP COLUMN IF EXISTS label,
      DROP COLUMN IF EXISTS original_filename
    `);
  }
}
