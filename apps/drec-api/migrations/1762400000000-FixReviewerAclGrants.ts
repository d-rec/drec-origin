import { MigrationInterface, QueryRunner } from 'typeorm';

// SeedReviewerAclPermissions1759800000000 had two bugs:
//
//  1. It INSERTed without a status column — schema default is 0, but
//     PermissionGuard filters status=1, so every Reviewer grant it
//     created was dead-on-arrival.
//
//  2. It granted DEVICE_REVIEWS_MANAGEMENT_CRUDL and CHAT_MANAGEMENT_CRUDL
//     but missed PASSWORD_MANAGEMENT_CRUDL — meaning a Reviewer
//     attempting to set their own password via the /reset-password
//     flow gets a silent 403, the UI swallows it, and the user is
//     stuck Pending.
//
// This migration:
//   a) flips status to 1 on existing Reviewer/SeniorReviewer grants
//      for DEVICE_REVIEWS and CHAT, and
//   b) backfills the missing PASSWORD_MANAGEMENT_CRUDL grant.
//
// Both steps are idempotent so it's safe to re-run / safe across envs
// that already had the gap manually patched.
export class FixReviewerAclGrants1762400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Activate any existing dead Reviewer/SeniorReviewer grants.
    await queryRunner.query(`
      UPDATE "aclmodulepermissions"
      SET status = 1
      WHERE "entityType" = 'Role'
        AND "entityId" IN (
          SELECT id FROM "user_role" WHERE name IN ('Reviewer', 'SeniorReviewer')
        )
        AND "aclmodulesId" IN (
          SELECT id FROM "aclmodules"
          WHERE name IN ('DEVICE_REVIEWS_MANAGEMENT_CRUDL', 'CHAT_MANAGEMENT_CRUDL')
        )
        AND status = 0
    `);

    // 2. Add PASSWORD_MANAGEMENT_CRUDL grant if missing.
    //    Permission bit values: Read=1, Write=2 → Write alone = 2.
    await queryRunner.query(`
      INSERT INTO "aclmodulepermissions"
        ("aclmodulesId", "entityType", "entityId", "permissions", "permissionValue", "status")
      SELECT a.id, 'Role', r.id, 'Write', 2, 1
      FROM "aclmodules" a, "user_role" r
      WHERE a.name = 'PASSWORD_MANAGEMENT_CRUDL'
        AND r.name IN ('Reviewer', 'SeniorReviewer')
        AND NOT EXISTS (
          SELECT 1 FROM "aclmodulepermissions" p
          WHERE p."aclmodulesId" = a.id
            AND p."entityType" = 'Role'
            AND p."entityId" = r.id
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse only the PASSWORD_MANAGEMENT_CRUDL backfill (the status
    // flip is not safely reversible — we don't know which grants were
    // originally status=0 on purpose).
    await queryRunner.query(`
      DELETE FROM "aclmodulepermissions"
      WHERE "entityType" = 'Role'
        AND "entityId" IN (
          SELECT id FROM "user_role" WHERE name IN ('Reviewer', 'SeniorReviewer')
        )
        AND "aclmodulesId" IN (
          SELECT id FROM "aclmodules" WHERE name = 'PASSWORD_MANAGEMENT_CRUDL'
        )
    `);
  }
}
