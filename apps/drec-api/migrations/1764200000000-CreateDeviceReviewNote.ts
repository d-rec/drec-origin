import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Per-field reviewer notes (option 2 from the 2026-05-11 notes-UX
 * conversation). Replaces the rudimentary `notes` textarea with a
 * threaded list of field-anchored comments. Lives at device scope
 * so feedback persists across approve/reject cycles. Status flips
 * between 'open' and 'resolved' so reviewers can keep history
 * visible without it cluttering the active list.
 */
export class CreateDeviceReviewNote1764200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "ix_device_review_note_device_id"
        ON "device_review_note" ("device_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "ix_device_review_note_open"
        ON "device_review_note" ("device_id")
        WHERE "status" = 'open'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "device_review_note"`);
  }
}
