import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEvidentDeviceIDAndStatusOnDeviceTable1749723392710
  implements MigrationInterface
{
  name = 'AddEvidentDeviceIDAndStatusOnDeviceTable1749723392710';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" ADD "evident_device_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" ADD "evident_status" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN "evident_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN "evident_device_id"`,
    );
  }
}
