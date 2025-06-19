import {MigrationInterface, QueryRunner} from "typeorm";

export class AddFrequencyToEvidentSettingsTable1750344248523 implements MigrationInterface {
    name = 'AddFrequencyToEvidentSettingsTable1750344248523'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
          `ALTER TABLE "evident_settings" ADD COLUMN "frequency" character varying(255)`,
        );
      }
    
      public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
          `ALTER TABLE "evident_settings" DROP COLUMN "frequency"`,
        );
      }
}
