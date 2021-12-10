import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrganizationOptionalProperties1639132234708
  implements MigrationInterface
{
  name = 'OrganizationOptionalProperties1639132234708';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organization" ALTER COLUMN "signatoryFullName" DROP NOT NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "organization"."signatoryFullName" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ALTER COLUMN "signatoryAddress" DROP NOT NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "organization"."signatoryAddress" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ALTER COLUMN "signatoryZipCode" DROP NOT NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "organization"."signatoryZipCode" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ALTER COLUMN "signatoryCity" DROP NOT NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "organization"."signatoryCity" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ALTER COLUMN "signatoryCountry" DROP NOT NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "organization"."signatoryCountry" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ALTER COLUMN "signatoryEmail" DROP NOT NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "organization"."signatoryEmail" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ALTER COLUMN "signatoryPhoneNumber" DROP NOT NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "organization"."signatoryPhoneNumber" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `COMMENT ON COLUMN "organization"."signatoryPhoneNumber" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ALTER COLUMN "signatoryPhoneNumber" SET NOT NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "organization"."signatoryEmail" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ALTER COLUMN "signatoryEmail" SET NOT NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "organization"."signatoryCountry" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ALTER COLUMN "signatoryCountry" SET NOT NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "organization"."signatoryCity" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ALTER COLUMN "signatoryCity" SET NOT NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "organization"."signatoryZipCode" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ALTER COLUMN "signatoryZipCode" SET NOT NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "organization"."signatoryAddress" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ALTER COLUMN "signatoryAddress" SET NOT NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "organization"."signatoryFullName" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ALTER COLUMN "signatoryFullName" SET NOT NULL`,
    );
  }
}
