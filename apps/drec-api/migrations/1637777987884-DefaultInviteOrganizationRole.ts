import { MigrationInterface, QueryRunner } from 'typeorm';

export class DefaultInviteOrganizationRole1637777987884
  implements MigrationInterface
{
  name = 'DefaultInviteOrganizationRole1637777987884';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `COMMENT ON COLUMN "organization_invitation"."role" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_invitation" ALTER COLUMN "role" SET DEFAULT 'DeviceOwner'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organization_invitation" ALTER COLUMN "role" SET DEFAULT 'OrganizationUser'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "organization_invitation"."role" IS NULL`,
    );
  }
}
