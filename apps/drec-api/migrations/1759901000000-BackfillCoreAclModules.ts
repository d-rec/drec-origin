import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Backfill ACL modules 1-12.
 *
 * The Seed migration (9999999999999) skips the entire insert when the
 * aclmodules table is non-empty.  Earlier migrations (1757000000002,
 * 1757000000007, 1757000000009) insert modules 13-15 *before* Seed runs,
 * so on every fresh database modules 1-12 are never created.  Any
 * non-Admin user then hits a 500 because PermissionGuard cannot resolve
 * the module id.
 */
export class BackfillCoreAclModules1759901000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const modules = [
      {
        id: 1,
        name: 'USER_MANAGEMENT_CRUDL',
        desc: 'User module management',
        perms: 'Read,Write,Update,Delete',
        val: 15,
      },
      {
        id: 2,
        name: 'ORGANIZATION_MANAGEMENT_CRUDL',
        desc: 'Organization module management',
        perms: 'Read,Write,Update,Delete',
        val: 15,
      },
      {
        id: 3,
        name: 'FILE_MANAGEMENT_CRUDL',
        desc: 'File module management',
        perms: 'Read,Write,Update,Delete',
        val: 15,
      },
      {
        id: 4,
        name: 'DEVICE_MANAGEMENT_CRUDL',
        desc: 'Device module management',
        perms: 'Read,Write,Update,Delete',
        val: 15,
      },
      {
        id: 5,
        name: 'DEVICE_GROUPING_MANAGEMENT_CRUDL',
        desc: 'Buyer Reservation module management',
        perms: 'Read,Write,Update,Delete',
        val: 15,
      },
      {
        id: 6,
        name: 'DEVICE_BULK_MANAGEMENT_CRUDL',
        desc: 'Bulk Device management',
        perms: 'Read,Write,Update,Delete',
        val: 15,
      },
      {
        id: 7,
        name: 'READS_MANAGEMENT_CRUDL',
        desc: 'Reads module management',
        perms: 'Read,Write,Update,Delete',
        val: 15,
      },
      {
        id: 8,
        name: 'CERTIFICATE_LOG_MANAGEMENT_CRUDL',
        desc: 'Certificate Log module management',
        perms: 'Read',
        val: 1,
      },
      {
        id: 9,
        name: 'INVITATION_MANAGEMENT_CRUDL',
        desc: 'Invitation module management',
        perms: 'Read,Write,Update,Delete',
        val: 15,
      },
      {
        id: 10,
        name: 'ADMIN_APIUSER_ORGANIZATION_CRUDL',
        desc: 'Organization information management',
        perms: 'Read,Write,Update,Delete',
        val: 15,
      },
      {
        id: 11,
        name: 'PASSWORD_MANAGEMENT_CRUDL',
        desc: 'Password management',
        perms: 'Write',
        val: 2,
      },
      {
        id: 12,
        name: 'PERMISSION_MANAGEMENT_CRUDL',
        desc: 'Permission module management',
        perms: 'Read,Write,Update',
        val: 7,
      },
    ];

    for (const m of modules) {
      await queryRunner.query(`
        INSERT INTO "aclmodules" ("id", "name", "description", "status", "permissions", "permissionsValue")
        SELECT ${m.id}, '${m.name}', 'ACL Module Name for ${m.desc}', 'Enable', '${m.perms}', ${m.val}
        WHERE NOT EXISTS (SELECT 1 FROM "aclmodules" WHERE "id" = ${m.id})
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "aclmodules" WHERE "id" BETWEEN 1 AND 12`,
    );
  }
}
