import { MigrationInterface, QueryRunner } from 'typeorm';

export class CommisioningEnumUpdate1633690977886 implements MigrationInterface {
  name = 'CommisioningEnumUpdate1633690977886';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."device_group_commissioningdaterange_enum" RENAME TO "device_group_commissioningdaterange_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "device_group_commissioningdaterange_enum" AS ENUM('Year1-Q1', 'Year1-Q2', 'Year1-Q3', 'Year1-Q4', 'Year2', 'Year3', 'Year4', 'Year5', '6-10years', '11-15years', '15+years')`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" ALTER COLUMN "commissioningDateRange" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" ALTER COLUMN "commissioningDateRange" TYPE "device_group_commissioningdaterange_enum"[] USING "commissioningDateRange"::"text"::"device_group_commissioningdaterange_enum"[]`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" ALTER COLUMN "commissioningDateRange" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `DROP TYPE "device_group_commissioningdaterange_enum_old"`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "device_group"."commissioningDateRange" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `COMMENT ON COLUMN "device_group"."commissioningDateRange" IS NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "device_group_commissioningdaterange_enum_old" AS ENUM('Year1', 'Year2', 'Year3', 'Year4', 'Year5', '6-10years', '11-15years', '15+years')`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" ALTER COLUMN "commissioningDateRange" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" ALTER COLUMN "commissioningDateRange" TYPE "device_group_commissioningdaterange_enum_old"[] USING "commissioningDateRange"::"text"::"device_group_commissioningdaterange_enum_old"[]`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" ALTER COLUMN "commissioningDateRange" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `DROP TYPE "device_group_commissioningdaterange_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "device_group_commissioningdaterange_enum_old" RENAME TO  "device_group_commissioningdaterange_enum"`,
    );
  }
}
