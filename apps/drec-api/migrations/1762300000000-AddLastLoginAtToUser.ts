import { MigrationInterface, QueryRunner } from 'typeorm';

// Add a real last_login_at column to the user table.
//
// Until now, the All Users page derived "Last used" from
// MAX(user_login_session.updatedAt) — but user_login_session is an
// active-sessions table: rows are deleted on logout, so a user who
// always logs out cleanly looks like they've never logged in. This
// migration lifts that to a proper last-login timestamp on the user
// itself, set on every successful auth (auth.service.ts).
//
// Backfill from whatever session rows survive so users who currently
// show a timestamp don't suddenly revert to "—".
export class AddLastLoginAtToUser1762300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user"
      ADD COLUMN IF NOT EXISTS "last_login_at" timestamp with time zone
    `);

    await queryRunner.query(`
      UPDATE "user" u
      SET "last_login_at" = s.max_updated
      FROM (
        SELECT "userId", MAX("updatedAt") AS max_updated
        FROM "user_login_session"
        GROUP BY "userId"
      ) s
      WHERE u.id = s."userId"
        AND u."last_login_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user" DROP COLUMN IF EXISTS "last_login_at"
    `);
  }
}
