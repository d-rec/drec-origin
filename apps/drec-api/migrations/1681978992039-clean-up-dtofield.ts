import { MigrationInterface, QueryRunner } from 'typeorm';

export class cleanUpDtofield1681978992039 implements MigrationInterface {
  name = 'cleanUpDtofield1681978992039';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" 
            DROP COLUMN "status",
            DROP COLUMN "data",
            DROP COLUMN "integrator"`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" 
            DROP COLUMN "standardCompliance",
            DROP COLUMN "installationConfigurations",
            DROP COLUMN "sectors",
            DROP COLUMN "labels"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" 
        ADD COLUMN "status" character varying,
        ADD COLUMN "data" jsonb,
        ADD COLUMN "integrator" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_group" 
        ADD COLUMN "standardCompliance" jsonb,
        ADD COLUMN "installationConfigurations" jsonb,
        ADD COLUMN "sectors" jsonb,
        ADD COLUMN "labels" jsonb`,
    );
  }
}
