import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateDocumentsType1747746958868 implements MigrationInterface {
  name = 'UpdateDocumentsType1747746958868';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "documents"
      ALTER COLUMN "type" TYPE VARCHAR
      USING "type"::text
    `);

    await queryRunner.query(`DROP TYPE document_type`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "documents"
      ALTER COLUMN "type" TYPE VARCHAR
    `);
  }
}
