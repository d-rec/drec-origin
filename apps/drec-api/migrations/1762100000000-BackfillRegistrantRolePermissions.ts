import { MigrationInterface, QueryRunner } from 'typeorm';

// SeedCoreRolePermissions1759901100000 inserts ACL rows for the
// Registrant role with `WHERE user_role.name = 'Registrant'`.
// On envs whose role history skipped the MarketIntermediary era,
// 1759900500000-RenameMarketIntermediaryToRegistrant is a no-op,
// so at the time SeedCoreRolePermissions runs no Registrant role
// exists yet — the inserts silently match zero rows.
// 1762000000000-EnsureRegistrantRole later backfills the role,
// but by then SeedCoreRolePermissions has already been recorded
// as applied and never runs again. Result: a Registrant user has
// the role but zero ACL entries → 403 on every guarded endpoint.
//
// Re-run the same idempotent inserts here, after EnsureRegistrantRole.
// On envs that already got it right, every NOT EXISTS clause matches,
// so this migration is a no-op.
export class BackfillRegistrantRolePermissions1762100000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const permissions: {
      module: string;
      perms: string;
      value: number;
    }[] = [
      { module: 'USER_MANAGEMENT_CRUDL',            perms: 'Read,Write,Update,Delete', value: 15 },
      { module: 'ORGANIZATION_MANAGEMENT_CRUDL',    perms: 'Read,Write,Update,Delete', value: 15 },
      { module: 'FILE_MANAGEMENT_CRUDL',            perms: 'Read,Write,Update,Delete', value: 15 },
      { module: 'DEVICE_MANAGEMENT_CRUDL',          perms: 'Read,Write,Update,Delete', value: 15 },
      { module: 'DEVICE_GROUPING_MANAGEMENT_CRUDL', perms: 'Read,Write,Update,Delete', value: 15 },
      { module: 'DEVICE_BULK_MANAGEMENT_CRUDL',     perms: 'Read,Write,Update,Delete', value: 15 },
      { module: 'READS_MANAGEMENT_CRUDL',           perms: 'Read,Write,Update,Delete', value: 15 },
      { module: 'CERTIFICATE_LOG_MANAGEMENT_CRUDL', perms: 'Read',                     value: 1  },
      { module: 'INVITATION_MANAGEMENT_CRUDL',      perms: 'Read,Write,Update,Delete', value: 15 },
      { module: 'PASSWORD_MANAGEMENT_CRUDL',        perms: 'Write',                    value: 2  },
      { module: 'DEVICE_REVIEWS_MANAGEMENT_CRUDL',  perms: 'Read,Write',               value: 3  },
      { module: 'SUBMISSION_MANAGEMENT_CRUDL',      perms: 'Read,Write,Update,Delete', value: 15 },
    ];

    for (const p of permissions) {
      await queryRunner.query(`
        INSERT INTO "aclmodulepermissions" ("aclmodulesId", "entityType", "entityId", "permissions", "permissionValue", "status")
        SELECT a.id, 'Role', r.id, '${p.perms}', ${p.value}, 1
        FROM "aclmodules" a, "user_role" r
        WHERE a.name = '${p.module}'
          AND r.name = 'Registrant'
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
    // No-op: this migration only fills holes left by an earlier
    // migration. Reverting it would delete legitimate permission
    // rows that the original migration was meant to create.
  }
}
