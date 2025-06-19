import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEvidentEmailOnEvidentSettingsTable1750266492529
  implements MigrationInterface
{
  name = 'AddEvidentEmailOnEvidentSettingsTable1750266492529';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "evident_settings" ADD COLUMN "email" character varying(255)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "evident_settings" DROP COLUMN "email"`,
    );
  }
}
