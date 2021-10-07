import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeviceGroupLabelsArray1633519035272 implements MigrationInterface {
  name = 'DeviceGroupLabelsArray1633519035272';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "device_group" DROP COLUMN "labels"`);
    await queryRunner.query(`ALTER TABLE "device_group" ADD "labels" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "device_group" DROP COLUMN "labels"`);
    await queryRunner.query(
      `ALTER TABLE "device_group" ADD "labels" character varying`,
    );
  }
}
