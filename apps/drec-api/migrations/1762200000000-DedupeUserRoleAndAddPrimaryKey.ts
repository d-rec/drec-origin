import { MigrationInterface, QueryRunner } from 'typeorm';

// The user_role table was created in 1635443974235-SCHEMA.ts without a
// PRIMARY KEY constraint — every other table in that migration has one,
// this one was missed. Five subsequent migrations insert into it with
// inconsistent strategies (some with explicit ids, some sequence-driven),
// and with no constraint to prevent collisions a fresh DB ends up with
// up to 12 rows for 8 logical roles, including duplicate ids and duplicate
// names. JOINs on user.roleId = user_role.id are non-deterministic when
// the id has multiple rows attached.
//
// Run after 9999999999999-Seed (which inserts the canonical rows from
// RoleJSON) so we can resolve the mess deterministically by name.
//
// Strategy:
//   1. Ensure all canonical rows from RoleJSON exist.
//   2. Remap user.roleId to the canonical id matching the user.role text.
//   3. Remap aclmodulepermissions.entityId by following the name of the
//      role row it currently references.
//   4. Drop duplicate ACL rows that emerge from the remap.
//   5. Delete every user_role row that isn't a canonical (id, name) pair.
//   6. Add the PK + UNIQUE(name) constraints that should have been there
//      since 2021.
//   7. Realign user_role_id_seq.
const CANONICAL: ReadonlyArray<{ id: number; name: string; description: string }> = [
  { id: 1, name: 'Admin',          description: 'for admin role' },
  { id: 3, name: 'SiteOperator',   description: 'Site Operator role for device management' },
  { id: 4, name: 'Buyer',          description: 'for Buyer role' },
  { id: 5, name: 'User',           description: 'for User role' },
  { id: 6, name: 'Registrant',     description: 'Registrant role for device registration and meter read submission' },
  { id: 7, name: 'SubBuyer',       description: 'Same as buyer but not delete any user of org' },
  { id: 8, name: 'Reviewer',       description: 'Reviewer role for device reviews' },
  { id: 9, name: 'SeniorReviewer', description: 'Senior Reviewer role for device reviews' },
];

export class DedupeUserRoleAndAddPrimaryKey1762200000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const values = CANONICAL.map((c) => `(${c.id}, '${c.name}')`).join(', ');

    // 1. Ensure each canonical (id, name) pair exists. Idempotent.
    for (const c of CANONICAL) {
      await queryRunner.query(`
        INSERT INTO "user_role" ("id", "name", "description", "status")
        SELECT ${c.id}, '${c.name}', '${c.description.replace(/'/g, "''")}', true
        WHERE NOT EXISTS (
          SELECT 1 FROM "user_role" WHERE "id" = ${c.id} AND "name" = '${c.name}'
        )
      `);
    }

    // 2. Remap user.roleId to the canonical id matching user.role text.
    await queryRunner.query(`
      UPDATE "user" u
      SET "roleId" = c.id
      FROM (VALUES ${values}) AS c(id, name)
      WHERE c.name = u.role
        AND u."roleId" IS DISTINCT FROM c.id
    `);

    // 3. Remap aclmodulepermissions.entityId by following the name of the
    //    user_role row it currently references. Skip rows whose entityId
    //    already matches the canonical id.
    await queryRunner.query(`
      UPDATE "aclmodulepermissions" ap
      SET "entityId" = c.id
      FROM "user_role" ur, (VALUES ${values}) AS c(id, name)
      WHERE ap."entityType" = 'Role'
        AND ap."entityId" = ur.id
        AND c.name = ur.name
        AND ap."entityId" IS DISTINCT FROM c.id
    `);

    // 4. Drop duplicate ACL rows (same module, entity, type) — keep lowest id.
    await queryRunner.query(`
      DELETE FROM "aclmodulepermissions" a
      USING "aclmodulepermissions" b
      WHERE a.id > b.id
        AND a."aclmodulesId" = b."aclmodulesId"
        AND a."entityType"   = b."entityType"
        AND a."entityId"     = b."entityId"
    `);

    // 5. Delete every user_role row that isn't a canonical (id, name) pair.
    await queryRunner.query(`
      DELETE FROM "user_role" ur
      WHERE NOT EXISTS (
        SELECT 1 FROM (VALUES ${values}) AS c(id, name)
        WHERE c.id = ur.id AND c.name = ur.name
      )
    `);

    // 6. Add the missing constraints.
    await queryRunner.query(
      `ALTER TABLE "user_role" ADD CONSTRAINT "PK_user_role_id" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_role" ADD CONSTRAINT "UQ_user_role_name" UNIQUE ("name")`,
    );

    // 7. Realign the sequence so the next nextval() lands above the highest id.
    await queryRunner.query(`
      SELECT setval(
        pg_get_serial_sequence('user_role', 'id'),
        COALESCE((SELECT MAX(id) FROM "user_role"), 1)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // The duplicate rows and rewritten FK references cannot be reconstructed.
    // Best we can do is drop the constraints to restore the broken-but-permissive
    // schema for environments that need to roll back.
    await queryRunner.query(
      `ALTER TABLE "user_role" DROP CONSTRAINT IF EXISTS "UQ_user_role_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_role" DROP CONSTRAINT IF EXISTS "PK_user_role_id"`,
    );
  }
}
