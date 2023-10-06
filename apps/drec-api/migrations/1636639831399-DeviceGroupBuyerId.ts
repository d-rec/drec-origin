import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeviceGroupBuyerId1636639831399 implements MigrationInterface {
  name = 'DeviceGroupBuyerId1636639831399';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device_group" ALTER COLUMN "buyerAddress" TYPE text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device_group" DROP COLUMN "buyerAddress"`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" ADD "buyerAddress" character varying`,
    );
  }
}
