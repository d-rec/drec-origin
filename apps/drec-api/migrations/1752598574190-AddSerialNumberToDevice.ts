import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSerialNumberToDevice1752598574190
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" ADD "serial_number" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" ADD "data_source" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "device" DROP COLUMN "serial_number"`);
    await queryRunner.query(`ALTER TABLE "device" DROP COLUMN "data_source"`);
  }
}
