import { MigrationInterface, QueryRunner } from 'typeorm';

// Permission bit values: Read=1, Write=2, Update=4, Delete=8
// Reviewer & SeniorReviewer: Read+Write = 3

export class SeedReviewerAclPermissions1759800000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Grant Reviewer and SeniorReviewer Read+Write on DEVICE_REVIEWS_MANAGEMENT_CRUDL
    await queryRunner.query(`
      INSERT INTO "aclmodulepermissions" ("aclmodulesId", "entityType", "entityId", "permissions", "permissionValue")
      SELECT a.id, 'Role', r.id, 'Read,Write', 3
      FROM "aclmodules" a, "user_role" r
      WHERE a.name = 'DEVICE_REVIEWS_MANAGEMENT_CRUDL'
        AND r.name IN ('Reviewer', 'SeniorReviewer')
        AND NOT EXISTS (
          SELECT 1 FROM "aclmodulepermissions" p
          WHERE p."aclmodulesId" = a.id AND p."entityType" = 'Role' AND p."entityId" = r.id
        )
    `);

    // Grant Reviewer and SeniorReviewer Read+Write on CHAT_MANAGEMENT_CRUDL
    await queryRunner.query(`
      INSERT INTO "aclmodulepermissions" ("aclmodulesId", "entityType", "entityId", "permissions", "permissionValue")
      SELECT a.id, 'Role', r.id, 'Read,Write', 3
      FROM "aclmodules" a, "user_role" r
      WHERE a.name = 'CHAT_MANAGEMENT_CRUDL'
        AND r.name IN ('Reviewer', 'SeniorReviewer')
        AND NOT EXISTS (
          SELECT 1 FROM "aclmodulepermissions" p
          WHERE p."aclmodulesId" = a.id AND p."entityType" = 'Role' AND p."entityId" = r.id
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "aclmodulepermissions"
      WHERE "entityType" = 'Role'
        AND "entityId" IN (SELECT id FROM "user_role" WHERE name IN ('Reviewer', 'SeniorReviewer'))
        AND "aclmodulesId" IN (SELECT id FROM "aclmodules" WHERE name IN ('DEVICE_REVIEWS_MANAGEMENT_CRUDL', 'CHAT_MANAGEMENT_CRUDL'))
    `);
  }
}
