import { MigrationInterface, QueryRunner } from 'typeorm';

export class addEvidentEmailOnEvidentSettingsTable1750266492529
  implements MigrationInterface
{
  name = 'addEvidentEmailOnEvidentSettingsTable1750266492529';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "evident_settings" ADD COLUMN "evident_email" character varying(255)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "evident_settings" DROP COLUMN "evident_email"`,
    );
  }
}
