import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeviceGroupAttributes1633366638472 implements MigrationInterface {
  name = 'DeviceGroupAttributes1633366638472';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device_group" ADD "fuelCode" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" ADD "countryCode" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" ADD "standardCompliance" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" ADD "deviceTypeCodes" text array NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "device_group_offtakers_enum" AS ENUM('School', 'HealthFacility', 'Residential', 'Commercial', 'Industrial', 'PublicSector')`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" ADD "offTakers" "device_group_offtakers_enum" array NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `CREATE TYPE "device_group_installationconfigurations_enum" AS ENUM('StandAlone', 'Microgrid')`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" ADD "installationConfigurations" "device_group_installationconfigurations_enum" array NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `CREATE TYPE "device_group_sectors_enum" AS ENUM('Agriculture', 'Manufacturing', 'PublicServices', 'Telecom ', 'Residential', 'Mining', 'Education', 'Health', 'Textiles  ', 'Financial ')`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" ADD "sectors" "device_group_sectors_enum" array NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `CREATE TYPE "device_group_commissioningdaterange_enum" AS ENUM('Year1', 'Year2', 'Year3', 'Year4', 'Year5', '6-10years', '11-15years', '15+years')`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" ADD "commissioningDateRange" "device_group_commissioningdaterange_enum" array NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" ADD "gridInterconnection" boolean NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" ADD "aggregatedCapacity" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" ADD "capacityRange" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" ADD "yieldValue" integer NOT NULL DEFAULT '1000'`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" ADD "labels" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "device_group" DROP COLUMN "labels"`);
    await queryRunner.query(
      `ALTER TABLE "device_group" DROP COLUMN "yieldValue"`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" DROP COLUMN "capacityRange"`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" DROP COLUMN "aggregatedCapacity"`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" DROP COLUMN "gridInterconnection"`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" DROP COLUMN "commissioningDateRange"`,
    );
    await queryRunner.query(
      `DROP TYPE "device_group_commissioningdaterange_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "device_group" DROP COLUMN "sectors"`);
    await queryRunner.query(`DROP TYPE "device_group_sectors_enum"`);
    await queryRunner.query(
      `ALTER TABLE "device_group" DROP COLUMN "installationConfigurations"`,
    );
    await queryRunner.query(
      `DROP TYPE "device_group_installationconfigurations_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" DROP COLUMN "offTakers"`,
    );
    await queryRunner.query(`DROP TYPE "device_group_offtakers_enum"`);
    await queryRunner.query(
      `ALTER TABLE "device_group" DROP COLUMN "deviceTypeCodes"`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" DROP COLUMN "standardCompliance"`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" DROP COLUMN "countryCode"`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" DROP COLUMN "fuelCode"`,
    );
  }
}
