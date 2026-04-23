import { MigrationInterface, QueryRunner } from 'typeorm';

export class MergeQualityLabelsIntoLabellingScheme1761100000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE device
      SET labelling_scheme_accreditation = CASE
        WHEN labelling_scheme_accreditation IS NULL OR labelling_scheme_accreditation = ''
          THEN "qualityLabels"
        ELSE labelling_scheme_accreditation || '; ' || "qualityLabels"
      END
      WHERE "qualityLabels" IS NOT NULL AND "qualityLabels" <> ''
    `);
    await queryRunner.query(`
      ALTER TABLE device DROP COLUMN IF EXISTS "qualityLabels"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE device ADD COLUMN IF NOT EXISTS "qualityLabels" VARCHAR NULL
    `);
  }
}
