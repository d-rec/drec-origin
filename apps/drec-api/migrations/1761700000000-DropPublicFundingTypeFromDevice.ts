import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropPublicFundingTypeFromDevice1761700000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Phase 2e: publicFundingType → subsidyTypes. Verified pre-migration on
    // stage that 0/1992 rows have public_funding_type set, so no backfill is
    // needed; prod and powertrust never had the column. Drop directly.
    await queryRunner.query(`
      ALTER TABLE device DROP COLUMN IF EXISTS public_funding_type
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE device ADD COLUMN IF NOT EXISTS public_funding_type VARCHAR NULL
    `);
  }
}
