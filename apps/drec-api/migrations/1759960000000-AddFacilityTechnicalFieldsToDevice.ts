import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFacilityTechnicalFieldsToDevice1759960000000
  implements MigrationInterface
{
  name = 'AddFacilityTechnicalFieldsToDevice1759960000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN "meter_ids" text;`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN "generating_unit_count" int;`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN "network_owner" varchar;`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN "interconnection_voltage" varchar;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN "interconnection_voltage";`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN "network_owner";`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN "generating_unit_count";`,
    );
    await queryRunner.query(`ALTER TABLE "device" DROP COLUMN "meter_ids";`);
  }
}
