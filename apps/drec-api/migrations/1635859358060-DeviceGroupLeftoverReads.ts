import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeviceGroupLeftoverReads1635859358060
  implements MigrationInterface
{
  name = 'DeviceGroupLeftoverReads1635859358060';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device_group" ADD "leftoverReads" double precision DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device_group" DROP COLUMN "leftoverReads"`,
    );
  }
}
