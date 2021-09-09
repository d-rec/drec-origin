import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrganizationBlochainAddress1631020416670
  implements MigrationInterface
{
  name = 'OrganizationBlochainAddress1631020416670';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "blockchainAccountSignedMessage" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "signatoryDocumentIds" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "documentIds" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "documentIds"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "signatoryDocumentIds"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "blockchainAccountSignedMessage"`,
    );
  }
}
