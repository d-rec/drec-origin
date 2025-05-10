import { MigrationInterface, QueryRunner } from 'typeorm';

export class deviceDocuments1746525161512 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE device_document_target_type AS ENUM ('organization');
      CREATE TYPE device_document_type AS ENUM (
        'Form SF-02 - Production Facility Registration',
        'SF-02C Owner''s Declaration or Proof of Ownership',
        'Metering Evidence',
        'Single Line Diagram',
        'Project Photos'
      );

      CREATE TABLE "deviceDocuments" (
        "id" SERIAL PRIMARY KEY,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "target_id" INTEGER NOT NULL,
        "target_type" device_document_target_type NOT NULL,
        "type" device_document_type NOT NULL,
        "extension" VARCHAR(255) NOT NULL,
        "url" VARCHAR(2000) NOT NULL
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_device_documents_device" ON "deviceDocuments" ("target_id")
      WHERE "target_type" = 'organization';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_device_documents_device"`);
    await queryRunner.query(`DROP TABLE "deviceDocuments"`);
    await queryRunner.query(`DROP TYPE device_document_type`);
    await queryRunner.query(`DROP TYPE device_document_target_type`);
  }
}
