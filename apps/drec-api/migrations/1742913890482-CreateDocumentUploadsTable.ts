import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocumentUploadsTable1742913890482
  implements MigrationInterface
{
  name = 'CreateDocumentUploadsTable1742913890482';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "document_uploads" (
        "id" SERIAL NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "organization_id" INTEGER NOT NULL,
        "incorporation_certificate" VARCHAR(500) NOT NULL,
        "legal_representative_passport" VARCHAR(500) NOT NULL,
        "address_proof" VARCHAR(500) NOT NULL,
        "owners_declaration" VARCHAR(500) NOT NULL,
        CONSTRAINT "PK_document_uploads" PRIMARY KEY ("id"),
        CONSTRAINT "FK_document_uploads_organization" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_document_uploads_organization_id" ON "document_uploads" ("organization_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_document_uploads_organization_id"`,
    );
    await queryRunner.query(`DROP TABLE "document_uploads"`);
  }
}
