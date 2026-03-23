import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAcCapacityToDevice1757000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN IF NOT EXISTS "acCapacity" double precision`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN IF EXISTS "acCapacity"`,
    );
  }
}
