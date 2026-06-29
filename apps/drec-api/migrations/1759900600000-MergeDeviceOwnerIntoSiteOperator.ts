import { MigrationInterface, QueryRunner } from 'typeorm';

export class MergeDeviceOwnerIntoSiteOperator1759900600000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Rename DeviceOwner role → SiteOperator on all users
    await queryRunner.query(`
      UPDATE "user"
      SET "role" = 'SiteOperator'
      WHERE "role" = 'DeviceOwner'
    `);

    // 2. Reassign ACL permissions from DeviceOwner (roleId=3) to SiteOperator
    //    First check if there's a SiteOperator user_role row; if not, rename DeviceOwner row
    const siteOpRole = await queryRunner.query(
      `SELECT id FROM "user_role" WHERE "name" = 'SiteOperator' LIMIT 1`,
    );

    if (siteOpRole.length === 0) {
      // No SiteOperator row exists — just rename DeviceOwner (id=3)
      await queryRunner.query(`
        UPDATE "user_role"
        SET "name" = 'SiteOperator',
            "description" = 'Site Operator role for device management'
        WHERE "name" = 'DeviceOwner'
      `);
    } else {
      // SiteOperator row exists — merge permissions and delete DeviceOwner row
      const siteOpId = siteOpRole[0].id;
      await queryRunner.query(
        `
        UPDATE "aclmodulepermissions"
        SET "entityId" = $1
        WHERE "entityId" = 3
          AND "entityType" = 'Role'
          AND "aclmodulesId" NOT IN (
            SELECT "aclmodulesId" FROM "aclmodulepermissions"
            WHERE "entityId" = $1 AND "entityType" = 'Role'
          )
      `,
        [siteOpId],
      );

      await queryRunner.query(`
        DELETE FROM "aclmodulepermissions"
        WHERE "entityId" = 3 AND "entityType" = 'Role'
      `);

      await queryRunner.query(`
        DELETE FROM "user_role" WHERE "name" = 'DeviceOwner'
      `);
    }

    // 3. Update invitation default role
    await queryRunner.query(`
      UPDATE "organization_invitation"
      SET "role" = 'SiteOperator'
      WHERE "role" = 'DeviceOwner'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert SiteOperator user_role row back to DeviceOwner (if id=3)
    await queryRunner.query(`
      UPDATE "user_role"
      SET "name" = 'DeviceOwner',
          "description" = 'for Device Owner role'
      WHERE "id" = 3 AND "name" = 'SiteOperator'
    `);

    await queryRunner.query(`
      UPDATE "user"
      SET "role" = 'DeviceOwner'
      WHERE "role" = 'SiteOperator'
    `);

    await queryRunner.query(`
      UPDATE "organization_invitation"
      SET "role" = 'DeviceOwner'
      WHERE "role" = 'SiteOperator'
    `);
  }
}
