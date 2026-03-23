import { MigrationInterface, QueryRunner } from 'typeorm';

// Permission bit values: Read=1, Write=2, Update=4, Delete=8
// Admin (roleId=1): Read+Write+Update+Delete = 15
// All other roles: Read+Write = 3

export class SeedChatPermissions1757000000007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "aclmodules" ("id", "name", "description", "status", "permissions", "permissionsValue")
      SELECT 14, 'CHAT_MANAGEMENT_CRUDL', 'ACL Module Name for Chat management', 'Enable', 'Read,Write,Update,Delete', 15
      WHERE NOT EXISTS (SELECT 1 FROM "aclmodules" WHERE "name" = 'CHAT_MANAGEMENT_CRUDL')
    `);

    await queryRunner.query(`
      INSERT INTO "aclmodulepermissions" ("aclmodulesId", "entityType", "entityId", "permissions", "permissionValue")
      VALUES
        (14, 'Role', 1, 'Read,Write,Update,Delete', 15),
        (14, 'Role', 2, 'Read,Write', 3),
        (14, 'Role', 3, 'Read,Write', 3),
        (14, 'Role', 4, 'Read,Write', 3),
        (14, 'Role', 5, 'Read,Write', 3),
        (14, 'Role', 6, 'Read,Write', 3),
        (14, 'Role', 7, 'Read,Write', 3)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "aclmodulepermissions" WHERE "aclmodulesId" = 14`,
    );
    await queryRunner.query(`DELETE FROM "aclmodules" WHERE "id" = 14`);
  }
}
