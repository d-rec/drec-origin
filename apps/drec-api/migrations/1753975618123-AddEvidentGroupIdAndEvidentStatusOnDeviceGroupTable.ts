import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEvidentGroupIdAndEvidentStatusOnDeviceGroupTable1753975618123
  implements MigrationInterface
{
  name = 'AddEvidentGroupIdAndEvidentStatusOnDeviceGroupTable1753975618123';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device_group" ADD "evident_group_id" varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" ADD "evident_status" varchar`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device_group" DROP COLUMN "evident_group_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" DROP COLUMN "evident_status"`,
    );
  }
}
