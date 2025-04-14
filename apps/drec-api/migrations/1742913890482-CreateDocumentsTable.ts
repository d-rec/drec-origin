import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocumentsTable1742913890482 implements MigrationInterface {
  name = 'CreateDocumentsTable1742913890482';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE document_target_type AS ENUM ('organization', 'device', 'user');
      CREATE TYPE document_type AS ENUM ('incorporation certificate', 'legal representative passport', 'address proof', 'owners declaration');
      
      CREATE TABLE "documents" (
        "id" SERIAL NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "target_id" INTEGER NOT NULL,
        "target_type" document_target_type NOT NULL,
        "type" document_type NOT NULL,
        "extension" VARCHAR(255) NOT NULL,
        "url" VARCHAR(500) NOT NULL,
        CONSTRAINT "PK_documents" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_documents_organization" ON "documents" ("target_id") WHERE "target_type" = 'organization'
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_documents_device" ON "documents" ("target_id") WHERE "target_type" = 'device'
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_documents_user" ON "documents" ("target_id") WHERE "target_type" = 'user'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_documents_user"`);
    await queryRunner.query(`DROP INDEX "IDX_documents_device"`);
    await queryRunner.query(`DROP INDEX "IDX_documents_organization"`);
    await queryRunner.query(`DROP TABLE "documents"`);
    await queryRunner.query(`DROP TYPE document_type`);
    await queryRunner.query(`DROP TYPE document_target_type`);
  }
}
