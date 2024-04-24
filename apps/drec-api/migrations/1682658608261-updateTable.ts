import { MigrationInterface, QueryRunner } from 'typeorm';

export class updateTable1682658608261 implements MigrationInterface {
  name = 'updateTable1682658608261';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE "developer_specific_manageGroupDevices_notFor_buyerReservation"`,
    );
    await queryRunner.query(
      `ALTER TABLE device_group ADD COLUMN "deviceIdsInt" bigint[]`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
