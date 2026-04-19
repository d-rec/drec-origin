import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropEnergyStorageFromDevice1761000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE device
        DROP COLUMN IF EXISTS "energyStorage",
        DROP COLUMN IF EXISTS "energyStorageCapacity"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE device
        ADD COLUMN IF NOT EXISTS "energyStorage" BOOLEAN NULL,
        ADD COLUMN IF NOT EXISTS "energyStorageCapacity" INTEGER NULL
    `);
  }
}
