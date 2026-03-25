import { MigrationInterface, QueryRunner } from 'typeorm';

// Permission bit values: Read=1, Write=2, Update=4, Delete=8
// OrganizationAdmin (roleId=2): Read+Write+Update+Delete = 15
// DeviceOwner       (roleId=3): Read+Write               =  3
// ApiUser           (roleId=6): Read+Write+Update+Delete = 15

export class SeedSubmissionPermissions1757000000002
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "aclmodules" ("id", "name", "description", "status", "permissions", "permissionsValue")
      SELECT 13, 'SUBMISSION_MANAGEMENT_CRUDL', 'ACL Module Name for S3 project submission management', 'Enable', 'Read,Write,Update,Delete', 15
      WHERE NOT EXISTS (SELECT 1 FROM "aclmodules" WHERE "name" = 'SUBMISSION_MANAGEMENT_CRUDL')
    `);

    await queryRunner.query(`
      INSERT INTO "aclmodulepermissions" ("aclmodulesId", "entityType", "entityId", "permissions", "permissionValue")
      VALUES
        (13, 'Role', 2, 'Read,Write,Update,Delete', 15),
        (13, 'Role', 3, 'Read,Write',               3),
        (13, 'Role', 6, 'Read,Write,Update,Delete', 15)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "aclmodulepermissions" WHERE "aclmodulesId" = 13`,
    );
    await queryRunner.query(`DELETE FROM "aclmodules" WHERE "id" = 13`);
  }
}
