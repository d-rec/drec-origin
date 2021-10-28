import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeviceGroupBuyer1635430218315 implements MigrationInterface {
  name = 'DeviceGroupBuyer1635430218315';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "device_group" ADD "buyerId" integer`);
    await queryRunner.query(
      `ALTER TABLE "device_group" ADD "buyerAddress" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device_group" DROP COLUMN "buyerAddress"`,
    );
    await queryRunner.query(`ALTER TABLE "device_group" DROP COLUMN "buyerId"`);
  }
}
