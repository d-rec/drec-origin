import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserOrgId1629285716933 implements MigrationInterface {
  name = 'UserOrgId1629285716933';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `COMMENT ON COLUMN "user"."organizationId" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "UQ_dfda472c0af7812401e592b6a61"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_dfda472c0af7812401e592b6a61" UNIQUE ("organizationId")`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "user"."organizationId" IS NULL`,
    );
  }
}
