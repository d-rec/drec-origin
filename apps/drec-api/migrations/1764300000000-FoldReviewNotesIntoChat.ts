import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fold the per-field reviewer-notes pipeline into the chat table so
 * the platform has a single device-scoped inbox. Plain chat, reviewer
 * notes, and future doc-references all live as typed messages.
 *
 * Changes:
 *  - chats:
 *      + kind, field_name, status, resolved_by, resolved_at, payload
 *      + partial index on open notes for the hot-path banner/badge
 *  - chat_conversations:
 *      + participant3, lastReadAt3   (optional third seat — senior reviewer
 *        / admin can join an existing registrant↔reviewer conversation
 *        without spawning a parallel chain)
 *  - device_review_note:
 *      → each row migrates into chats (kind='note') under the device's
 *        existing reviewer↔registrant conversation. If no conversation
 *        exists yet (note was created before chat was opened), one is
 *        synthesised from the device's submitter + a placeholder
 *        reviewer slot ('reviewer@unknown') — the next legitimate
 *        chat open() merges into it via deviceSiteName.
 *      → table dropped after data migration.
 */
export class FoldReviewNotesIntoChat1764300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── chat_conversations: third seat ───────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "chat_conversations"
        ADD COLUMN IF NOT EXISTS "participant3" varchar NULL,
        ADD COLUMN IF NOT EXISTS "lastReadAt3" timestamptz NULL
    `);

    // ── chats: typed-message columns ────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "chats"
        ADD COLUMN IF NOT EXISTS "kind" varchar(16) NOT NULL DEFAULT 'text',
        ADD COLUMN IF NOT EXISTS "field_name" varchar(64) NULL,
        ADD COLUMN IF NOT EXISTS "status" varchar(16) NULL,
        ADD COLUMN IF NOT EXISTS "resolved_by" varchar(255) NULL,
        ADD COLUMN IF NOT EXISTS "resolved_at" timestamptz NULL,
        ADD COLUMN IF NOT EXISTS "payload" jsonb NULL
    `);

    // Partial index on open notes — hot path is "show me open notes
    // for this device" (banner + badge).
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "ix_chats_open_notes"
        ON "chats" ("kind", "status")
        WHERE "kind" = 'note' AND "status" = 'open'
    `);

    // ── data migration: device_review_note → chats ───────────────────
    // For each note, find the device's siteName + submitter (the
    // registrant). Find-or-create the reviewer↔registrant conversation
    // by (deviceSiteName, participant1=submitter). Then append a chat
    // row of kind='note' to that conversation.
    type Row = {
      id: number;
      device_id: number;
      field_name: string | null;
      body: string;
      status: 'open' | 'resolved';
      created_by: string;
      created_at: Date;
      resolved_by: string | null;
      resolved_at: Date | null;
    };
    let notes: Row[] = [];
    try {
      notes = await queryRunner.query(
        `SELECT * FROM "device_review_note" ORDER BY created_at ASC`,
      );
    } catch {
      // table never existed (fresh installs running this migration in
      // sequence with 1764200000000 already applied may also be fresh
      // enough that the table is gone) — nothing to migrate.
      notes = [];
    }

    for (const note of notes) {
      const deviceRows: Array<{ siteName: string; submitter: string | null }> =
        await queryRunner.query(
          `SELECT d."siteName" AS "siteName",
                  u.email AS submitter
           FROM device d
           LEFT JOIN "user" u ON u."organizationId" = d."organizationId"
           WHERE d.id = $1
           ORDER BY u.id ASC
           LIMIT 1`,
          [note.device_id],
        );
      const siteName = deviceRows[0]?.siteName ?? `device-${note.device_id}`;
      const submitter = deviceRows[0]?.submitter ?? 'unknown@registrant';

      // find-or-create the conversation for this device
      let convRows: Array<{ id: number; headUuid: string | null }> =
        await queryRunner.query(
          `SELECT id, "headUuid" FROM chat_conversations
           WHERE "deviceSiteName" = $1
           ORDER BY id ASC
           LIMIT 1`,
          [siteName],
        );
      let convId: number;
      let headUuid: string | null;
      if (convRows.length) {
        convId = convRows[0].id;
        headUuid = convRows[0].headUuid;
      } else {
        // No prior chat for this device — synthesize one. Reviewer
        // slot is filled with the note's created_by (the reviewer
        // who opened it). The chain head is the synthetic note we're
        // about to insert.
        const headIns: Array<{ uuid: string }> = await queryRunner.query(
          `INSERT INTO chats (username, "chatEntry", kind, field_name, status,
                              resolved_by, resolved_at, "createdAt")
           VALUES ($1, $2, 'note', $3, $4, $5, $6, $7)
           RETURNING uuid`,
          [
            note.created_by,
            note.body,
            note.field_name,
            note.status,
            note.resolved_by,
            note.resolved_at,
            note.created_at,
          ],
        );
        headUuid = headIns[0].uuid;
        const convIns: Array<{ id: number }> = await queryRunner.query(
          `INSERT INTO chat_conversations
             (participant1, participant2, "headUuid", "lastEntryUuid",
              "deviceSiteName")
           VALUES ($1, $2, $3, $3, $4)
           RETURNING id`,
          [submitter, note.created_by, headUuid, siteName],
        );
        convId = convIns[0].id;
        continue;
      }

      // Append the note to the existing chain.
      const ins: Array<{ uuid: string }> = await queryRunner.query(
        `INSERT INTO chats (username, "chatEntry", kind, field_name, status,
                            resolved_by, resolved_at, "createdAt")
         VALUES ($1, $2, 'note', $3, $4, $5, $6, $7)
         RETURNING uuid`,
        [
          note.created_by,
          note.body,
          note.field_name,
          note.status,
          note.resolved_by,
          note.resolved_at,
          note.created_at,
        ],
      );
      const newUuid = ins[0].uuid;

      // Link the previous tail to this new entry, then set conv tail.
      const tail: Array<{ lastEntryUuid: string | null }> =
        await queryRunner.query(
          `SELECT "lastEntryUuid" FROM chat_conversations WHERE id = $1`,
          [convId],
        );
      if (tail[0]?.lastEntryUuid) {
        await queryRunner.query(
          `UPDATE chats SET "nextEntryUuid" = $1 WHERE uuid = $2`,
          [newUuid, tail[0].lastEntryUuid],
        );
      }
      await queryRunner.query(
        `UPDATE chat_conversations SET "lastEntryUuid" = $1 WHERE id = $2`,
        [newUuid, convId],
      );
    }

    // Done — drop the old table.
    await queryRunner.query(`DROP TABLE IF EXISTS "device_review_note"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-create the empty table; do NOT try to extract notes back out
    // of chats (the chain links would orphan).
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "device_review_note" (
        "id" SERIAL PRIMARY KEY,
        "device_id" INTEGER NOT NULL,
        "field_name" VARCHAR(64) NULL,
        "body" TEXT NOT NULL,
        "status" VARCHAR(16) NOT NULL DEFAULT 'open',
        "created_by" VARCHAR(255) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "resolved_by" VARCHAR(255) NULL,
        "resolved_at" TIMESTAMPTZ NULL
      )
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS "ix_chats_open_notes"`);
    await queryRunner.query(`
      ALTER TABLE "chats"
        DROP COLUMN IF EXISTS "kind",
        DROP COLUMN IF EXISTS "field_name",
        DROP COLUMN IF EXISTS "status",
        DROP COLUMN IF EXISTS "resolved_by",
        DROP COLUMN IF EXISTS "resolved_at",
        DROP COLUMN IF EXISTS "payload"
    `);
    await queryRunner.query(`
      ALTER TABLE "chat_conversations"
        DROP COLUMN IF EXISTS "participant3",
        DROP COLUMN IF EXISTS "lastReadAt3"
    `);
  }
}
