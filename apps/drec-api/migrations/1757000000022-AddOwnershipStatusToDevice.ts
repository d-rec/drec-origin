import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOwnershipStatusToDevice1757000000022
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN IF NOT EXISTS "ownership_status" varchar DEFAULT 'unverified'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN IF EXISTS "ownership_status"`,
    );
  }
}
