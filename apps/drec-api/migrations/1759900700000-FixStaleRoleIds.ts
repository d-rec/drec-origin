import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixStaleRoleIds1759900700000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Fix users whose roleId still points to deleted OrganizationAdmin (id=2)
    // or DeviceOwner (id=3, now renamed to SiteOperator)
    await queryRunner.query(`
      UPDATE "user" u
      SET "roleId" = ur.id
      FROM "user_role" ur
      WHERE ur."name" = u."role"
        AND u."roleId" != ur.id
    `);
  }

  public async down(): Promise<void> {
    // No revert needed — this is a data consistency fix
  }
}
