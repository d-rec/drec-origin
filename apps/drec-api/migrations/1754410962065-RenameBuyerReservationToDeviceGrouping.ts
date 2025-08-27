import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameBuyerReservationToDeviceGrouping1754410962065
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "aclmodules" SET "name" = 'DEVICE_GROUPING_MANAGEMENT_CRUDL', "description" = 'ACL Module Name for Device Grouping module management' WHERE name='BUYER_RESERVATION_MANAGEMENT_CRUDL'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "aclmodules" SET "name" = 'BUYER_RESERVATION_MANAGEMENT_CRUDL', "description" = 'ACL Module Name for Buyer Reservation module management' WHERE name='DEVICE_GROUPING_MANAGEMENT_CRUDL'`,
    );
  }
}
