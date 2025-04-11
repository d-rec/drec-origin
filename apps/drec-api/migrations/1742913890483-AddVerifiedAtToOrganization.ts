import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVerifiedAtToOrganization1742913890483
  implements MigrationInterface
{
  name = 'AddVerifiedAtToOrganization1742913890483';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "organization" 
      ADD COLUMN "verified_at" TIMESTAMP WITH TIME ZONE DEFAULT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_organization_verified_at" ON "organization" ("verified_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_organization_verified_at"`);
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "verified_at"`,
    );
  }
}
