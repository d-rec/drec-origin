import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSourceAccessModeToDevice1757000000019
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "device"
      ADD COLUMN IF NOT EXISTS "sourceAccessMode" varchar NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "device"
      DROP COLUMN IF EXISTS "sourceAccessMode"
    `);
  }
}
