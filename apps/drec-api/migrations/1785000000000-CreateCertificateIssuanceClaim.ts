import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `certificate_issuance_claim` — the backstop against minting the same
 * device-group period twice.
 *
 * Concurrency in the issuance path has produced real over-issuance: as of
 * 2026-10-19 prod holds 105 device+period pairs with more than one confirmed
 * on-chain certificate, 54 of them minted after the cron-lock fix (#803) had
 * shipped. The leader election added in the preceding commit stops two
 * replicas signing at once, but it is a lock — if it ever lapses, nothing
 * downstream refuses the duplicate. This table does.
 *
 * A row is inserted BEFORE the mint and the unique index is what rejects the
 * second attempt, so the guarantee does not depend on anything being read
 * first. Both racing copies derive the same (groupId, start, end) from the
 * same reads, so they collide deterministically.
 *
 * It is a new, empty table on purpose. The obvious place for this constraint
 * was check_certificate_issue_date_log_for_device, but that table cannot carry
 * one: 2,457 (externalId, start, end) tuples are already duplicated there
 * across 209,266 excess rows, one of them 1,168 times over. Cleaning that is a
 * separate job and is not a prerequisite for closing the double-mint hole.
 *
 * A claim is deleted when its mint fails, so a genuine retry is never blocked
 * by the failed attempt that preceded it.
 */
export class CreateCertificateIssuanceClaim1785000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "certificate_issuance_claim" (
        "id"                           SERIAL PRIMARY KEY,
        "groupId"                      integer NOT NULL,
        "generation_start"             timestamptz NOT NULL,
        "generation_end"               timestamptz NOT NULL,
        "certificate_transaction_uid"  character varying,
        "claimed_at"                   timestamptz NOT NULL DEFAULT now()
      )
    `);

    // The guarantee itself. Not merely an index — this is the only thing that
    // makes a concurrent duplicate mint fail rather than succeed twice.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_certificate_issuance_claim_period"
        ON "certificate_issuance_claim"
           ("groupId", "generation_start", "generation_end")
    `);

    // Supports the cleanup of stale claims by age.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_certificate_issuance_claim_claimed_at"
        ON "certificate_issuance_claim" ("claimed_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_certificate_issuance_claim_claimed_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_certificate_issuance_claim_period"`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "certificate_issuance_claim"`,
    );
  }
}
