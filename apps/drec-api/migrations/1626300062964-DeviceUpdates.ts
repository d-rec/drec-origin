import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeviceUpdates1626300062964 implements MigrationInterface {
  name = 'DeviceUpdates1626300062964';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" ADD "yield" integer NOT NULL DEFAULT '1000'`,
    );
    await queryRunner.query(`ALTER TABLE "device" DROP COLUMN "capacity"`);
    await queryRunner.query(
      `ALTER TABLE "device" ADD "capacity" integer NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "device" DROP COLUMN "capacity"`);
    await queryRunner.query(
      `ALTER TABLE "device" ADD "capacity" character varying NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "device" DROP COLUMN "yield"`);
  }
}
