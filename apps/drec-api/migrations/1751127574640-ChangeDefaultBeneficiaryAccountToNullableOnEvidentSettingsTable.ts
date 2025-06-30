import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeDefaultBeneficiaryAccountToNullableOnEvidentSettingsTable1751125202867
  implements MigrationInterface
{
  name =
    'ChangeDefaultBeneficiaryAccountToNullableOnEvidentSettingsTable1751125202867';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "evident_settings"
            ALTER COLUMN "default_beneficiary_account" DROP NOT NULL;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "evident_settings"
            ALTER COLUMN "default_beneficiary_account" SET NOT NULL;
        `);
  }
}
