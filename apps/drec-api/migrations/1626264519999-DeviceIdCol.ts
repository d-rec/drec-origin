import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeviceIdCol1626264519999 implements MigrationInterface {
  name = 'DeviceIdCol1626264519999';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" ADD "drecID" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" ADD CONSTRAINT "UQ_a93bf3af71fa160724c7ae04a2e" UNIQUE ("drecID")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" DROP CONSTRAINT "UQ_a93bf3af71fa160724c7ae04a2e"`,
    );
    await queryRunner.query(`ALTER TABLE "device" DROP COLUMN "drecID"`);
  }
}
