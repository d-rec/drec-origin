import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeviceGroupLeftoverReads1635785881039
  implements MigrationInterface
{
  name = 'DeviceGroupLeftoverReads1635785881039';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device_group" ADD "leftoverReads" numeric(10,2) DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device_group" DROP COLUMN "leftoverReads"`,
    );
  }
}
