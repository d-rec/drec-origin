import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Rename DocumentType.SF_02C_OWNERS_DECLARATION → PROOF_OF_OWNERSHIP.
 *
 * Background: the enum value SF_02C_OWNERS_DECLARATION was bound to the
 * "Proof of Ownership" UI slot (OC# field 47), while OC# field 46
 * ("SF-02c (Owner's Declaration letter)") binds to SF_02C. The OD
 * letter and a proof-of-ownership artifact (deed / lease / PPA) are two
 * distinct documents; the enum naming was misleading and confused the
 * auto-classifier. Source code now uses PROOF_OF_OWNERSHIP for the
 * slot-47 documents; this migration aligns existing rows.
 *
 * Authoritative assumption: every documents.type = 'SF_02C_OWNERS_DECLARATION'
 * row was uploaded via the slot-47 Proof of Ownership input, so the
 * new name accurately describes the artifact.
 */
export class RenameSF02COwnersDeclarationToProofOfOwnership1763200000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "documents"
       SET "type" = 'PROOF_OF_OWNERSHIP'
       WHERE "type" = 'SF_02C_OWNERS_DECLARATION'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "documents"
       SET "type" = 'SF_02C_OWNERS_DECLARATION'
       WHERE "type" = 'PROOF_OF_OWNERSHIP'`,
    );
  }
}
