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

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
