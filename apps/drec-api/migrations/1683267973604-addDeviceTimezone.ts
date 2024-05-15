import { MigrationInterface, QueryRunner } from 'typeorm';

export class addDeviceTimezone1683267973604 implements MigrationInterface {
  name = 'addDeviceTimezone1683267973604';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN "timezone" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN "version" character varying  DEFAULT '1.0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN IF EXISTS "timezone"`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN IF EXISTS "version"`,
    );  
  }
}
