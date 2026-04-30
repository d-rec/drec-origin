import { MigrationInterface, QueryRunner } from 'typeorm';

// Phase 1c — OC#49 canonical: SCREENSHOTS and METERING_EVIDENCE both carry
// metering evidence for the registrant; collapsing to the OC#-aligned name.
// Existing SCREENSHOTS rows are reclassified in place. The enum value stays
// in the DocumentType TS enum for historical audit queries.
export class MergeScreenshotsIntoMeteringEvidence1761600000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE documents
      SET type = 'METERING_EVIDENCE'
      WHERE type = 'SCREENSHOTS'
    `);
  }

  public async down(): Promise<void> {
    // Merge is intentionally one-way — no reliable way to re-split rows by
    // original source once they've been reclassified.
  }
}
