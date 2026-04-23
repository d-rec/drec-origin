import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSldCapacityToDevice1759600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN IF NOT EXISTS "sld_capacity_kw" decimal NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN IF EXISTS "sld_capacity_kw"`,
    );
  }
}
