import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLegacyDeviceStatus1757000000013
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // IREC_Status is a varchar column, so no enum type to alter.
    // Set all existing devices to 'Legacy' status.
    await queryRunner.query(`
      UPDATE device SET "IREC_Status" = 'Legacy'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE device SET "IREC_Status" = 'NotRegistered' WHERE "IREC_Status" = 'Legacy'
    `);
  }
}
