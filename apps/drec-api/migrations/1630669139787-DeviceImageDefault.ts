import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeviceImageDefault1630669139787 implements MigrationInterface {
  name = 'DeviceImageDefault1630669139787';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`COMMENT ON COLUMN "device"."images" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "device" ALTER COLUMN "images" DROP DEFAULT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" ALTER COLUMN "images" SET DEFAULT '[]'`,
    );
    await queryRunner.query(`COMMENT ON COLUMN "device"."images" IS NULL`);
  }
}
