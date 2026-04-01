import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGroupReviewStatusToDeviceGroup1757000000021
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the enum type first
    await queryRunner.query(
      `DO $$ BEGIN
        CREATE TYPE "group_review_status_enum" AS ENUM ('pending', 'approved', 'rejected');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$`,
    );

    await queryRunner.query(
      `ALTER TABLE "device_group" ADD COLUMN IF NOT EXISTS "group_review_status" "group_review_status_enum" DEFAULT 'pending'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device_group" DROP COLUMN IF EXISTS "group_review_status"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "group_review_status_enum"`,
    );
  }
}
