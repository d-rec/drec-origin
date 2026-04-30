import { MigrationInterface, QueryRunner } from 'typeorm';

// Permission bit values: Read=1, Write=2, Update=4, Delete=8
// CRUD = 15, Read+Write = 3, Read = 1, Write = 2

export class SeedMissingRolePermissions1759900300000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- 1. Add SiteOperator role if it doesn't exist ---
    await queryRunner.query(`
      INSERT INTO "user_role" ("id", "name", "description", "status")
      SELECT 10, 'SiteOperator', 'Site Operator role', true
      WHERE NOT EXISTS (SELECT 1 FROM "user_role" WHERE "name" = 'SiteOperator')
    `);

    // --- 2. Ensure all MarketIntermediary permissions are enabled ---
    await queryRunner.query(`
      UPDATE "aclmodulepermissions" SET status = 1
      WHERE "entityType" = 'Role'
        AND "entityId" = (SELECT id FROM "user_role" WHERE name = 'MarketIntermediary')
        AND status = 0
    `);

    // --- 3. Fix MarketIntermediary: add ORGANIZATION_MANAGEMENT_CRUDL ---
    await queryRunner.query(`
      INSERT INTO "aclmodulepermissions" ("aclmodulesId", "entityType", "entityId", "permissions", "permissionValue")
      SELECT a.id, 'Role', r.id, 'Read,Write,Update,Delete', 15
      FROM "aclmodules" a, "user_role" r
      WHERE a.name = 'ORGANIZATION_MANAGEMENT_CRUDL'
        AND r.name = 'MarketIntermediary'
        AND NOT EXISTS (
          SELECT 1 FROM "aclmodulepermissions" p
          WHERE p."aclmodulesId" = a.id AND p."entityType" = 'Role' AND p."entityId" = r.id
        )
    `);

    // --- 4. Fix MarketIntermediary: add USER_MANAGEMENT_CRUDL ---
    await queryRunner.query(`
      INSERT INTO "aclmodulepermissions" ("aclmodulesId", "entityType", "entityId", "permissions", "permissionValue")
      SELECT a.id, 'Role', r.id, 'Read,Write,Update,Delete', 15
      FROM "aclmodules" a, "user_role" r
      WHERE a.name = 'USER_MANAGEMENT_CRUDL'
        AND r.name = 'MarketIntermediary'
        AND NOT EXISTS (
          SELECT 1 FROM "aclmodulepermissions" p
          WHERE p."aclmodulesId" = a.id AND p."entityType" = 'Role' AND p."entityId" = r.id
        )
    `);

    // --- 4. Fix DeviceOwner: grant same permissions as OrgAdmin ---
    const modules = [
      { name: 'USER_MANAGEMENT_CRUDL', perms: 'Read,Write,Update', value: 7 },
      {
        name: 'ORGANIZATION_MANAGEMENT_CRUDL',
        perms: 'Read,Write,Update,Delete',
        value: 15,
      },
      {
        name: 'FILE_MANAGEMENT_CRUDL',
        perms: 'Read,Write,Update,Delete',
        value: 15,
      },
      {
        name: 'DEVICE_MANAGEMENT_CRUDL',
        perms: 'Read,Write,Update,Delete',
        value: 15,
      },
      {
        name: 'DEVICE_GROUPING_MANAGEMENT_CRUDL',
        perms: 'Read,Write,Update,Delete',
        value: 15,
      },
      {
        name: 'DEVICE_BULK_MANAGEMENT_CRUDL',
        perms: 'Read,Write,Update,Delete',
        value: 15,
      },
      {
        name: 'READS_MANAGEMENT_CRUDL',
        perms: 'Read,Write,Update,Delete',
        value: 15,
      },
      { name: 'CERTIFICATE_LOG_MANAGEMENT_CRUDL', perms: 'Read', value: 1 },
      {
        name: 'INVITATION_MANAGEMENT_CRUDL',
        perms: 'Read,Write,Update,Delete',
        value: 15,
      },
      { name: 'PASSWORD_MANAGEMENT_CRUDL', perms: 'Write', value: 2 },
    ];

    for (const mod of modules) {
      // DeviceOwner (same as OrgAdmin)
      await queryRunner.query(`
        INSERT INTO "aclmodulepermissions" ("aclmodulesId", "entityType", "entityId", "permissions", "permissionValue")
        SELECT a.id, 'Role', r.id, '${mod.perms}', ${mod.value}
        FROM "aclmodules" a, "user_role" r
        WHERE a.name = '${mod.name}'
          AND r.name = 'DeviceOwner'
          AND NOT EXISTS (
            SELECT 1 FROM "aclmodulepermissions" p
            WHERE p."aclmodulesId" = a.id AND p."entityType" = 'Role' AND p."entityId" = r.id
          )
      `);

      // SiteOperator (same as OrgAdmin)
      await queryRunner.query(`
        INSERT INTO "aclmodulepermissions" ("aclmodulesId", "entityType", "entityId", "permissions", "permissionValue")
        SELECT a.id, 'Role', r.id, '${mod.perms}', ${mod.value}
        FROM "aclmodules" a, "user_role" r
        WHERE a.name = '${mod.name}'
          AND r.name = 'SiteOperator'
          AND NOT EXISTS (
            SELECT 1 FROM "aclmodulepermissions" p
            WHERE p."aclmodulesId" = a.id AND p."entityType" = 'Role' AND p."entityId" = r.id
          )
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "aclmodulepermissions"
      WHERE "entityType" = 'Role'
        AND "entityId" IN (SELECT id FROM "user_role" WHERE name IN ('DeviceOwner', 'SiteOperator'))
        AND "aclmodulesId" IN (SELECT id FROM "aclmodules" WHERE name NOT IN ('CHAT_MANAGEMENT_CRUDL', 'SUBMISSION_MANAGEMENT_CRUDL'))
    `);
    await queryRunner.query(`
      DELETE FROM "aclmodulepermissions"
      WHERE "entityType" = 'Role'
        AND "entityId" = (SELECT id FROM "user_role" WHERE name = 'MarketIntermediary')
        AND "aclmodulesId" IN (SELECT id FROM "aclmodules" WHERE name IN ('ORGANIZATION_MANAGEMENT_CRUDL', 'USER_MANAGEMENT_CRUDL'))
    `);
    await queryRunner.query(
      `DELETE FROM "user_role" WHERE "name" = 'SiteOperator'`,
    );
  }
}
