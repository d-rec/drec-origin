import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddScreenStatusToDevice1759700000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN IF NOT EXISTS "last_screen_status" varchar(10) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN IF NOT EXISTS "last_screened_at" timestamptz NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN IF EXISTS "last_screened_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN IF EXISTS "last_screen_status"`,
    );
  }
}
