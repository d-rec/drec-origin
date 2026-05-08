import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Re-backfill Registrant role ACL permissions.
 *
 * Background:
 *   - 1759901100000-SeedCoreRolePermissions seeds Registrant grants
 *     via `WHERE r.name = 'Registrant'` over user_role.
 *   - 1762000000000-EnsureRegistrantRole creates the Registrant role
 *     row when missing.
 *   - 1762100000000-BackfillRegistrantRolePermissions was meant to
 *     re-run the seed once Registrant existed.
 *
 * On stage (verified 2026-05-08) Registrant has ZERO ACL grants
 * despite all three migrations being recorded as applied. Result: a
 * Registrant user hits 403 on every guarded endpoint, including
 * GET /Organization/registrant/all_organization (the dashboard).
 *
 * This migration is idempotent: it only inserts grants that don't
 * already exist for the Registrant role. On envs that are already
 * correct it's a no-op.
 */
export class RebackfillRegistrantRolePermissions1763500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const permissions: { module: string; perms: string; value: number }[] = [
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
      await queryRunner.query(
        `
        INSERT INTO "aclmodulepermissions"
          ("aclmodulesId", "entityType", "entityId", "permissions", "permissionValue", "status")
        SELECT a.id, 'Role', r.id, $1, $2, 1
        FROM "aclmodules" a, "user_role" r
        WHERE a.name = $3
          AND r.name = 'Registrant'
          AND NOT EXISTS (
            SELECT 1 FROM "aclmodulepermissions" ep
            WHERE ep."aclmodulesId" = a.id
              AND ep."entityType" = 'Role'
              AND ep."entityId" = r.id
          )
        `,
        [p.perms, p.value, p.module],
      );
    }
  }

  public async down(): Promise<void> {
    // No-op: this migration only fills holes left by earlier seeds.
  }
}
