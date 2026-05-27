import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Per-document AI extraction results keyed by (document_id, endpoint).
 *
 * The ai_response_cache table is keyed by content_hash — useful for
 * skipping a re-extraction round-trip but invisible to "what did this
 * particular document yield." That gap meant the meter-IDs panel in
 * Add Devices was in-memory only: extractions from Tesseract never
 * even hit ai_response_cache (client-side OCR bypasses the server),
 * so reopening the device on a different machine showed an empty
 * panel until the user manually re-extracted.
 *
 * This table is the authoritative store: each successful extraction
 * upserts a row, the existing-docs API returns them inline, and the
 * UI seeds its component state from there on page load.
 */
export class CreateDocumentExtractions1781000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "document_extractions" (
        "id" SERIAL PRIMARY KEY,
        "document_id" INTEGER NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
        "endpoint" TEXT NOT NULL,
        "response" JSONB NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "document_extractions_doc_endpoint_uq"
        ON "document_extractions" ("document_id", "endpoint");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "document_extractions_doc_idx"
        ON "document_extractions" ("document_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "document_extractions";`);
  }
}
