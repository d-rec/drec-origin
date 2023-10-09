import { MigrationInterface, QueryRunner } from 'typeorm';

export class DefaultDeviceYieldValue1638197036511
  implements MigrationInterface
{
  name = 'DefaultDeviceYieldValue1638197036511';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`COMMENT ON COLUMN "device"."yieldValue" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "device" ALTER COLUMN "yieldValue" SET DEFAULT '1500'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" ALTER COLUMN "yieldValue" SET DEFAULT '1000'`,
    );
    await queryRunner.query(`COMMENT ON COLUMN "device"."yieldValue" IS NULL`);
  }
}
