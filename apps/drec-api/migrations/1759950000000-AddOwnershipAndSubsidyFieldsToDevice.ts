import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOwnershipAndSubsidyFieldsToDevice1759950000000
  implements MigrationInterface
{
  name = 'AddOwnershipAndSubsidyFieldsToDevice1759950000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ownership & off-taker (Evident checklist rows 76, 77, 81)
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN "pv_system_owner" varchar;`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN "off_taker_name" varchar;`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN "off_taker_same_company_as_owner" varchar;`,
    );
    // Subsidies & incentives (rows 78, 79, 80)
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN "has_subsidy" varchar;`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN "subsidy_types" text;`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN "subsidy_other_details" varchar;`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN "subsidy_claims_eacs" varchar;`,
    );
    // Public funding (rows 50, 51)
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN "has_public_funding" varchar;`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN "public_funding_end_date" date;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN "public_funding_end_date";`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN "has_public_funding";`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN "subsidy_claims_eacs";`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN "subsidy_other_details";`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN "subsidy_types";`,
    );
    await queryRunner.query(`ALTER TABLE "device" DROP COLUMN "has_subsidy";`);
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN "off_taker_same_company_as_owner";`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN "off_taker_name";`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN "pv_system_owner";`,
    );
  }
}
