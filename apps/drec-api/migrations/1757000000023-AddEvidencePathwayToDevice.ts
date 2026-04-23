import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEvidencePathwayToDevice1757000000023
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN IF NOT EXISTS "evidence_pathway" varchar`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN IF EXISTS "evidence_pathway"`,
    );
  }
}
