import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnumsUpdate1637747712217 implements MigrationInterface {
  name = 'EnumsUpdate1637747712217';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device_group" DROP COLUMN "capacityRange"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."device_group_capacityrange_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" ADD "capacityRange" text NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device_group" DROP COLUMN "capacityRange"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."device_group_capacityrange_enum" AS ENUM('0-50watts', '51-500watts', '501watts-1kW', '1.001kW-50kW', '50.001kW-100kW', '100.001kW-1MW', '1.001MW+')`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" ADD "capacityRange" "device_group_capacityrange_enum" NOT NULL`,
    );
  }
}
