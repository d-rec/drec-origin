import { MigrationInterface, QueryRunner } from 'typeorm';

// 1759900500000-RenameMarketIntermediaryToRegistrant assumes a
// MarketIntermediary user_role row exists and renames it to Registrant.
// On envs that never had MarketIntermediary (e.g. stage, whose role
// history skipped the MI era), the rename is a no-op yet the same
// migration deletes OrganizationAdmin anyway — leaving the env with
// no Registrant role at all. Backfill one here, idempotently.
export class EnsureRegistrantRole1762000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "user_role" ("name", "description", "status")
      SELECT 'Registrant',
             'Registrant role for device registration and meter read submission',
             true
      WHERE NOT EXISTS (SELECT 1 FROM "user_role" WHERE "name" = 'Registrant')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "user_role" WHERE "name" = 'Registrant'`,
    );
  }
}
