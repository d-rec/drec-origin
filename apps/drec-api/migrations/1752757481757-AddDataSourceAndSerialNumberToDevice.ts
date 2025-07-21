import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDataSourceAndSerialNumberToDevice1752757481757
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" ADD "serial_number" character varying DEFAULT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" ADD CONSTRAINT "UQ_device_serial_number" UNIQUE ("serial_number")`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" ADD "data_source" character varying DEFAULT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" ADD "other_data_source" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "device" DROP COLUMN "serial_number"`);
    await queryRunner.query(`ALTER TABLE "device" DROP COLUMN "data_source"`);
    await queryRunner.query(
      `ALTER TABLE "device" DROP CONSTRAINT "UQ_device_serial_number"`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN "other_data_source"`,
    );
  }
}
