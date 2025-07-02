import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLastIssuanceSyncedAtOnEvidentSettingsTable1751453685479
  implements MigrationInterface
{
  name = 'AddLastIssuanceSyncedAtOnEvidentSettingsTable1751453685479';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "evident_settings"
            ADD COLUMN "last_issuance_synced_at" TIMESTAMP NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "evident_settings"
            DROP COLUMN "last_issuance_synced_at"
        `);
  }
}
