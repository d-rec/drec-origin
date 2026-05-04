import { MigrationInterface, QueryRunner } from 'typeorm';

// Reviewer / SeniorReviewer landing on the device-reviews page hit
// GET /api/Organization/me to discover their org. That endpoint is
// guarded by ORGANIZATION_MANAGEMENT_CRUDL Read — which the seed
// never granted to Reviewer roles. Result: silent 403, page never
// populates, click-on-sidemenu appears to do nothing.
//
// Same family of bug as 1762400000000-FixReviewerAclGrants. Backfill
// the missing Read grant for both reviewer roles. Idempotent.
export class AddReviewerOrganizationReadGrant1762500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Permission bit: Read = 1
    await queryRunner.query(`
      INSERT INTO "aclmodulepermissions"
        ("aclmodulesId", "entityType", "entityId", "permissions", "permissionValue", "status")
      SELECT a.id, 'Role', r.id, 'Read', 1, 1
      FROM "aclmodules" a, "user_role" r
      WHERE a.name = 'ORGANIZATION_MANAGEMENT_CRUDL'
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
    await queryRunner.query(`
      DELETE FROM "aclmodulepermissions"
      WHERE "entityType" = 'Role'
        AND "entityId" IN (
          SELECT id FROM "user_role" WHERE name IN ('Reviewer', 'SeniorReviewer')
        )
        AND "aclmodulesId" IN (
          SELECT id FROM "aclmodules" WHERE name = 'ORGANIZATION_MANAGEMENT_CRUDL'
        )
        AND permissions = 'Read'
    `);
  }
}
