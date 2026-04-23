import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropMeterIdsFromDevice1761400000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE device
      SET serial_number = serial_number || ';' || REPLACE(meter_ids, ',', ';')
      WHERE meter_ids IS NOT NULL
        AND meter_ids <> ''
        AND position(meter_ids in serial_number) = 0
    `);
    await queryRunner.query(`
      ALTER TABLE device DROP COLUMN IF EXISTS meter_ids
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE device ADD COLUMN IF NOT EXISTS meter_ids TEXT NULL
    `);
  }
}
