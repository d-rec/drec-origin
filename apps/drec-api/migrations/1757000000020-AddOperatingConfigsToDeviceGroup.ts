import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOperatingConfigsToDeviceGroup1757000000020
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device_group" ADD COLUMN IF NOT EXISTS "operatingConfigurations" text[] DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device_group" DROP COLUMN IF EXISTS "operatingConfigurations"`,
    );
  }
}
