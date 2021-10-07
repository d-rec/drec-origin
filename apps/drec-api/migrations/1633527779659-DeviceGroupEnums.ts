import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeviceGroupEnums1633527779659 implements MigrationInterface {
  name = 'DeviceGroupEnums1633527779659';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device_group" DROP COLUMN "standardCompliance"`,
    );
    await queryRunner.query(
      `CREATE TYPE "device_group_standardcompliance_enum" AS ENUM('I-REC', 'REC', 'GO', 'TIGR')`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" ADD "standardCompliance" "device_group_standardcompliance_enum" NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."device_group_sectors_enum" RENAME TO "device_group_sectors_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "device_group_sectors_enum" AS ENUM('Agriculture', 'Manufacturing', 'PublicServices', 'Telecom', 'Residential', 'Mining', 'Education', 'Health', 'Textiles', 'Financial')`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" ALTER COLUMN "sectors" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" ALTER COLUMN "sectors" TYPE "device_group_sectors_enum"[] USING "sectors"::"text"::"device_group_sectors_enum"[]`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" ALTER COLUMN "sectors" SET DEFAULT '{}'`,
    );
    await queryRunner.query(`DROP TYPE "device_group_sectors_enum_old"`);
    await queryRunner.query(
      `COMMENT ON COLUMN "device_group"."sectors" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" DROP COLUMN "capacityRange"`,
    );
    await queryRunner.query(
      `CREATE TYPE "device_group_capacityrange_enum" AS ENUM('0-50watts', '51-500watts', '501watts-1kW', '1.001kW-50kW', '50.001kW-100kW', '100.001kW-1MW', '1.001MW+')`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" ADD "capacityRange" "device_group_capacityrange_enum" NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device_group" DROP COLUMN "capacityRange"`,
    );
    await queryRunner.query(`DROP TYPE "device_group_capacityrange_enum"`);
    await queryRunner.query(
      `ALTER TABLE "device_group" ADD "capacityRange" character varying NOT NULL`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "device_group"."sectors" IS NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "device_group_sectors_enum_old" AS ENUM('Agriculture', 'Manufacturing', 'PublicServices', 'Telecom ', 'Residential', 'Mining', 'Education', 'Health', 'Textiles  ', 'Financial ')`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" ALTER COLUMN "sectors" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" ALTER COLUMN "sectors" TYPE "device_group_sectors_enum_old"[] USING "sectors"::"text"::"device_group_sectors_enum_old"[]`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" ALTER COLUMN "sectors" SET DEFAULT '{}'`,
    );
    await queryRunner.query(`DROP TYPE "device_group_sectors_enum"`);
    await queryRunner.query(
      `ALTER TYPE "device_group_sectors_enum_old" RENAME TO  "device_group_sectors_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" DROP COLUMN "standardCompliance"`,
    );
    await queryRunner.query(`DROP TYPE "device_group_standardcompliance_enum"`);
    await queryRunner.query(
      `ALTER TABLE "device_group" ADD "standardCompliance" character varying NOT NULL`,
    );
  }
}
