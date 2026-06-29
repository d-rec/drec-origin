import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seed core ACL permissions for Registrant, Buyer, and SubBuyer roles.
 *
 * These were previously only created by `pnpm seed:permissions` which had
 * to be run manually.  Without them every non-Admin user hits a 500
 * because PermissionGuard cannot resolve their role permissions.
 *
 * Existing migrations already cover:
 *   - DeviceOwner / SiteOperator  (1759900300000)
 *   - MarketIntermediary          (1759900300000)
 *   - Reviewer / SeniorReviewer   (1759800000000)
 *   - Modules 13/14/15 for most roles (1757000000002/7/9)
 */
export class SeedCoreRolePermissions1759901100000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const permissions: {
      role: string;
      module: string;
      perms: string;
      value: number;
    }[] = [
      // ── Registrant ──
      {
        role: 'Registrant',
        module: 'USER_MANAGEMENT_CRUDL',
        perms: 'Read,Write,Update,Delete',
        value: 15,
      },
      {
        role: 'Registrant',
        module: 'ORGANIZATION_MANAGEMENT_CRUDL',
        perms: 'Read,Write,Update,Delete',
        value: 15,
      },
      {
        role: 'Registrant',
        module: 'FILE_MANAGEMENT_CRUDL',
        perms: 'Read,Write,Update,Delete',
        value: 15,
      },
      {
        role: 'Registrant',
        module: 'DEVICE_MANAGEMENT_CRUDL',
        perms: 'Read,Write,Update,Delete',
        value: 15,
      },
      {
        role: 'Registrant',
        module: 'DEVICE_GROUPING_MANAGEMENT_CRUDL',
        perms: 'Read,Write,Update,Delete',
        value: 15,
      },
      {
        role: 'Registrant',
        module: 'DEVICE_BULK_MANAGEMENT_CRUDL',
        perms: 'Read,Write,Update,Delete',
        value: 15,
      },
      {
        role: 'Registrant',
        module: 'READS_MANAGEMENT_CRUDL',
        perms: 'Read,Write,Update,Delete',
        value: 15,
      },
      {
        role: 'Registrant',
        module: 'CERTIFICATE_LOG_MANAGEMENT_CRUDL',
        perms: 'Read',
        value: 1,
      },
      {
        role: 'Registrant',
        module: 'INVITATION_MANAGEMENT_CRUDL',
        perms: 'Read,Write,Update,Delete',
        value: 15,
      },
      {
        role: 'Registrant',
        module: 'PASSWORD_MANAGEMENT_CRUDL',
        perms: 'Write',
        value: 2,
      },
      {
        role: 'Registrant',
        module: 'DEVICE_REVIEWS_MANAGEMENT_CRUDL',
        perms: 'Read,Write',
        value: 3,
      },
      {
        role: 'Registrant',
        module: 'SUBMISSION_MANAGEMENT_CRUDL',
        perms: 'Read,Write,Update,Delete',
        value: 15,
      },

      // ── Buyer ──
      {
        role: 'Buyer',
        module: 'USER_MANAGEMENT_CRUDL',
        perms: 'Read,Write,Update',
        value: 7,
      },
      {
        role: 'Buyer',
        module: 'ORGANIZATION_MANAGEMENT_CRUDL',
        perms: 'Read',
        value: 1,
      },
      {
        role: 'Buyer',
        module: 'DEVICE_GROUPING_MANAGEMENT_CRUDL',
        perms: 'Read',
        value: 1,
      },
      {
        role: 'Buyer',
        module: 'CERTIFICATE_LOG_MANAGEMENT_CRUDL',
        perms: 'Read',
        value: 1,
      },
      {
        role: 'Buyer',
        module: 'INVITATION_MANAGEMENT_CRUDL',
        perms: 'Read,Write,Update,Delete',
        value: 15,
      },
      {
        role: 'Buyer',
        module: 'PASSWORD_MANAGEMENT_CRUDL',
        perms: 'Write',
        value: 2,
      },

      // ── SubBuyer ──
      {
        role: 'SubBuyer',
        module: 'DEVICE_GROUPING_MANAGEMENT_CRUDL',
        perms: 'Read,Write',
        value: 3,
      },
      {
        role: 'SubBuyer',
        module: 'CERTIFICATE_LOG_MANAGEMENT_CRUDL',
        perms: 'Read',
        value: 1,
      },
      {
        role: 'SubBuyer',
        module: 'INVITATION_MANAGEMENT_CRUDL',
        perms: 'Read,Write,Update,Delete',
        value: 15,
      },
      {
        role: 'SubBuyer',
        module: 'PASSWORD_MANAGEMENT_CRUDL',
        perms: 'Write',
        value: 2,
      },

      // ── MarketIntermediary (modules not covered by 1759900300000) ──
      {
        role: 'MarketIntermediary',
        module: 'CERTIFICATE_LOG_MANAGEMENT_CRUDL',
        perms: 'Read',
        value: 1,
      },
      {
        role: 'MarketIntermediary',
        module: 'DEVICE_MANAGEMENT_CRUDL',
        perms: 'Read,Write,Update,Delete',
        value: 15,
      },
      {
        role: 'MarketIntermediary',
        module: 'FILE_MANAGEMENT_CRUDL',
        perms: 'Read,Write,Update,Delete',
        value: 15,
      },
      {
        role: 'MarketIntermediary',
        module: 'READS_MANAGEMENT_CRUDL',
        perms: 'Read,Write,Update,Delete',
        value: 15,
      },
      {
        role: 'MarketIntermediary',
        module: 'PASSWORD_MANAGEMENT_CRUDL',
        perms: 'Write',
        value: 2,
      },

      // ── Reviewer / SeniorReviewer: DEVICE_MANAGEMENT Read (not covered by 1759800000000) ──
      {
        role: 'Reviewer',
        module: 'DEVICE_MANAGEMENT_CRUDL',
        perms: 'Read',
        value: 1,
      },
      {
        role: 'SeniorReviewer',
        module: 'DEVICE_MANAGEMENT_CRUDL',
        perms: 'Read',
        value: 1,
      },
    ];

    for (const p of permissions) {
      await queryRunner.query(`
        INSERT INTO "aclmodulepermissions" ("aclmodulesId", "entityType", "entityId", "permissions", "permissionValue", "status")
        SELECT a.id, 'Role', r.id, '${p.perms}', ${p.value}, 1
        FROM "aclmodules" a, "user_role" r
        WHERE a.name = '${p.module}'
          AND r.name = '${p.role}'
          AND NOT EXISTS (
            SELECT 1 FROM "aclmodulepermissions" ep
            WHERE ep."aclmodulesId" = a.id
              AND ep."entityType" = 'Role'
              AND ep."entityId" = r.id
          )
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const roles = ['Registrant', 'Buyer', 'SubBuyer'];
    for (const role of roles) {
      await queryRunner.query(`
        DELETE FROM "aclmodulepermissions"
        WHERE "entityType" = 'Role'
          AND "entityId" = (SELECT id FROM "user_role" WHERE name = '${role}' LIMIT 1)
          AND "aclmodulesId" IN (
            SELECT id FROM "aclmodules" WHERE name IN (
              'USER_MANAGEMENT_CRUDL', 'ORGANIZATION_MANAGEMENT_CRUDL',
              'FILE_MANAGEMENT_CRUDL', 'DEVICE_MANAGEMENT_CRUDL',
              'DEVICE_GROUPING_MANAGEMENT_CRUDL', 'DEVICE_BULK_MANAGEMENT_CRUDL',
              'READS_MANAGEMENT_CRUDL', 'CERTIFICATE_LOG_MANAGEMENT_CRUDL',
              'INVITATION_MANAGEMENT_CRUDL', 'PASSWORD_MANAGEMENT_CRUDL',
              'DEVICE_REVIEWS_MANAGEMENT_CRUDL', 'SUBMISSION_MANAGEMENT_CRUDL'
            )
          )
      `);
    }
  }
}
