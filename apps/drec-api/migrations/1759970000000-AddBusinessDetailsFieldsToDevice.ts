import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBusinessDetailsFieldsToDevice1759970000000
  implements MigrationInterface
{
  name = 'AddBusinessDetailsFieldsToDevice1759970000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN "has_captive_consumer" varchar;`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN "has_auxiliary_energy_sources" varchar;`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN "auxiliary_energy_source_details" varchar;`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN "non_meter_import_details" varchar;`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN "other_eac_scheme_registration" text;`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN "additional_info" text;`,
    );
    // General (rows 2, 8)
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN "default_account_code" varchar;`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN "requested_effective_reg_date" date;`,
    );
    // Signature & evidence pathway (rows 55-56, 58-59, 61-62)
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN "signatory_name" varchar;`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN "is_grid_connected" varchar;`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN "grid_export_type" varchar;`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN "has_network_meter" varchar;`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN "meter_reads_shareable" varchar;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN "meter_reads_shareable";`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN "has_network_meter";`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN "grid_export_type";`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN "is_grid_connected";`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN "signatory_name";`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN "requested_effective_reg_date";`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN "default_account_code";`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN "additional_info";`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN "other_eac_scheme_registration";`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN "non_meter_import_details";`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN "auxiliary_energy_source_details";`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN "has_auxiliary_energy_sources";`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN "has_captive_consumer";`,
    );
  }
}
