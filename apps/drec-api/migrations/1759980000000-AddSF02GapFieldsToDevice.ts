import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSF02GapFieldsToDevice1759980000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE device
        ADD COLUMN IF NOT EXISTS registration_type VARCHAR NULL,
        ADD COLUMN IF NOT EXISTS volume_evidence_type VARCHAR NULL,
        ADD COLUMN IF NOT EXISTS public_funding_type VARCHAR NULL,
        ADD COLUMN IF NOT EXISTS labelling_scheme_accreditation VARCHAR NULL,
        ADD COLUMN IF NOT EXISTS verification_agent_name VARCHAR NULL,
        ADD COLUMN IF NOT EXISTS off_grid_circumstances TEXT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE device
        DROP COLUMN IF EXISTS registration_type,
        DROP COLUMN IF EXISTS volume_evidence_type,
        DROP COLUMN IF EXISTS public_funding_type,
        DROP COLUMN IF EXISTS labelling_scheme_accreditation,
        DROP COLUMN IF EXISTS verification_agent_name,
        DROP COLUMN IF EXISTS off_grid_circumstances
    `);
  }
}
