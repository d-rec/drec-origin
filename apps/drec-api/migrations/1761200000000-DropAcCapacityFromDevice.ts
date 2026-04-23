import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropAcCapacityFromDevice1761200000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE device
      SET capacity = "acCapacity"
      WHERE (capacity IS NULL OR capacity = 0)
        AND "acCapacity" IS NOT NULL AND "acCapacity" > 0
    `);
    await queryRunner.query(`
      ALTER TABLE device DROP COLUMN IF EXISTS "acCapacity"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE device ADD COLUMN IF NOT EXISTS "acCapacity" double precision NULL
    `);
  }
}
