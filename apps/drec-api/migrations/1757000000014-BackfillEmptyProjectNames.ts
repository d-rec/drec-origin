import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillEmptyProjectNames1757000000014
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE device
      SET "projectName" = COALESCE(NULLIF("developerExternalId", ''), "externalId")
      WHERE "projectName" IS NULL OR "projectName" = ''
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Cannot reliably revert — original values were already empty/null
  }
}
