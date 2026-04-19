import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropIsGridConnectedFromDevice1761300000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE device
      SET "gridInterconnection" = (is_grid_connected = 'Yes')
      WHERE "gridInterconnection" IS NULL AND is_grid_connected IS NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE device DROP COLUMN IF EXISTS is_grid_connected
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE device ADD COLUMN IF NOT EXISTS is_grid_connected VARCHAR NULL
    `);
  }
}
