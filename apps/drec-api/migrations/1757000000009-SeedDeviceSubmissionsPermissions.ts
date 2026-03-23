import { MigrationInterface, QueryRunner } from 'typeorm';

// Permission bit values: Read=1, Write=2, Update=4, Delete=8
// Admin (roleId=1): Read = 1

export class SeedDeviceSubmissionsPermissions1757000000009
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "aclmodules" ("id", "name", "description", "status", "permissions", "permissionsValue")
      SELECT 15, 'DEVICE_SUBMISSIONS_MANAGEMENT_CRUDL', 'ACL Module for Admin device submission document review', 'Enable', 'Read', 1
      WHERE NOT EXISTS (SELECT 1 FROM "aclmodules" WHERE "name" = 'DEVICE_SUBMISSIONS_MANAGEMENT_CRUDL')
    `);

    await queryRunner.query(`
      INSERT INTO "aclmodulepermissions" ("aclmodulesId", "entityType", "entityId", "permissions", "permissionValue")
      SELECT 15, 'Role', 1, 'Read', 1
      WHERE NOT EXISTS (
        SELECT 1 FROM "aclmodulepermissions"
        WHERE "aclmodulesId" = 15 AND "entityType" = 'Role' AND "entityId" = 1
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "aclmodulepermissions" WHERE "aclmodulesId" = 15`,
    );
    await queryRunner.query(`DELETE FROM "aclmodules" WHERE "id" = 15`);
  }
}
