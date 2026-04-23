import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameMarketIntermediaryToRegistrant1759900500000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Rename MarketIntermediary org type → Registrant
    await queryRunner.query(`
      UPDATE "organization"
      SET "organizationType" = 'Registrant'
      WHERE "organizationType" = 'MarketIntermediary'
    `);

    // 2. Rename MarketIntermediary role → Registrant
    await queryRunner.query(`
      UPDATE "user"
      SET "role" = 'Registrant'
      WHERE "role" = 'MarketIntermediary'
    `);

    // 3. Merge OrganizationAdmin role → Registrant (both role text and roleId FK)
    await queryRunner.query(`
      UPDATE "user"
      SET "role" = 'Registrant',
          "roleId" = (SELECT id FROM "user_role" WHERE "name" = 'Registrant' LIMIT 1)
      WHERE "role" = 'OrganizationAdmin'
    `);

    // 4. Update MarketIntermediary user_role row (id=6) to Registrant
    await queryRunner.query(`
      UPDATE "user_role"
      SET "name" = 'Registrant',
          "description" = 'Registrant role for device registration and meter read submission'
      WHERE "name" = 'MarketIntermediary'
    `);

    // 5. Reassign any ACL permissions from OrganizationAdmin (roleId=2) to Registrant (roleId=6)
    //    First update permissions that don't conflict, then delete duplicates
    await queryRunner.query(`
      UPDATE "aclmodulepermissions"
      SET "entityId" = (SELECT id FROM "user_role" WHERE "name" = 'Registrant' LIMIT 1)
      WHERE "entityId" = 2
        AND "entityType" = 'Role'
        AND "aclmodulesId" NOT IN (
          SELECT "aclmodulesId" FROM "aclmodulepermissions"
          WHERE "entityId" = (SELECT id FROM "user_role" WHERE "name" = 'Registrant' LIMIT 1)
            AND "entityType" = 'Role'
        )
    `);

    // Delete any remaining OrganizationAdmin permission rows (duplicates of Registrant)
    await queryRunner.query(`
      DELETE FROM "aclmodulepermissions"
      WHERE "entityId" = 2 AND "entityType" = 'Role'
    `);

    // 6. Remove the OrganizationAdmin user_role row
    await queryRunner.query(`
      DELETE FROM "user_role" WHERE "name" = 'OrganizationAdmin'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-create OrganizationAdmin user_role
    await queryRunner.query(`
      INSERT INTO "user_role" ("id", "name", "description", "status")
      VALUES (2, 'OrganizationAdmin', 'for Organization admin', true)
      ON CONFLICT ("id") DO NOTHING
    `);

    // Revert Registrant → MarketIntermediary
    await queryRunner.query(`
      UPDATE "organization"
      SET "organizationType" = 'MarketIntermediary'
      WHERE "organizationType" = 'Registrant'
    `);

    await queryRunner.query(`
      UPDATE "user"
      SET "role" = 'MarketIntermediary'
      WHERE "role" = 'Registrant'
    `);

    await queryRunner.query(`
      UPDATE "user_role"
      SET "name" = 'MarketIntermediary',
          "description" = 'Market Intermediary role for API access'
      WHERE "name" = 'Registrant'
    `);
  }
}
