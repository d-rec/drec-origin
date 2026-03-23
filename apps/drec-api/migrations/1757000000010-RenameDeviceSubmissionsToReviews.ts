import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameDeviceSubmissionsToReviews1757000000010
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE aclmodules SET name = 'DEVICE_REVIEWS_MANAGEMENT_CRUDL' WHERE name = 'DEVICE_SUBMISSIONS_MANAGEMENT_CRUDL'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE aclmodules SET name = 'DEVICE_SUBMISSIONS_MANAGEMENT_CRUDL' WHERE name = 'DEVICE_REVIEWS_MANAGEMENT_CRUDL'
    `);
  }
}
