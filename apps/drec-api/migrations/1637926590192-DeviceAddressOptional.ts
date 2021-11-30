import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeviceAddressOptional1637926590192 implements MigrationInterface {
  name = 'DeviceAddressOptional1637926590192';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" ALTER COLUMN "address" DROP NOT NULL`,
    );
    await queryRunner.query(`COMMENT ON COLUMN "device"."address" IS NULL`);
    await queryRunner.query(`ALTER TABLE "device" DROP COLUMN "zipCode"`);
    await queryRunner.query(
      `ALTER TABLE "device" ADD "zipCode" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "device" DROP COLUMN "zipCode"`);
    await queryRunner.query(`ALTER TABLE "device" ADD "zipCode" integer`);
    await queryRunner.query(`COMMENT ON COLUMN "device"."address" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "device" ALTER COLUMN "address" SET NOT NULL`,
    );
  }
}
