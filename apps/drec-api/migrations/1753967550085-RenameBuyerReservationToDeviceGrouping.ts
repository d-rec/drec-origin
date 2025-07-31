import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameBuyerReservationToDeviceGrouping1753967550085
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "aclmodules" SET "name" = 'DEVICE_GROUPING_MANAGEMENT_CRUDL' WHERE id=5;`,
    );
    await queryRunner.query(
      `UPDATE "aclmodules" SET "description" = 'ACL Module Name for Device Grouping module management' WHERE id=5;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "aclmodules" SET "name" = 'BUYER_RESERVATION_MANAGEMENT_CRUDL' WHERE id=5;`,
    );
    await queryRunner.query(
      `UPDATE "aclmodules" SET "description" = 'ACL Module Name for Buyer Reservation module management' WHERE id=5;`,
    );
  }
}
