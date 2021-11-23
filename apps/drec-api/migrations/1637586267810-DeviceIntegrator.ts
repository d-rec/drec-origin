import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeviceIntegrator1637586267810 implements MigrationInterface {
  name = 'DeviceIntegrator1637586267810';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" ADD "integrator" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "device" DROP COLUMN "integrator"`);
  }
}
