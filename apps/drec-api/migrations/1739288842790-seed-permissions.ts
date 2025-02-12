import { MigrationInterface, QueryRunner } from 'typeorm';

export class seedPermissions1739288842790 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            INSERT INTO public.aclmodulepermissions (
                "aclmodulesId", 
                "entityId", 
                "entityType", 
                "permissions", 
                "permissionValue", 
                "status"
            ) 
            VALUES
                (1, 2, 'Role', 'Read,Write,Update,Delete', 15, 1),
                (2, 2, 'Role', 'Read,Write,Update,Delete', 15, 1),
                (3, 2, 'Role', 'Read,Write,Update,Delete', 15, 1),
                (4, 2, 'Role', 'Read,Write,Update,Delete', 15, 1),
                (5, 2, 'Role', 'Read', 15, 1),
                (6, 2, 'Role', 'Read,Write,Update,Delete', 15, 1),
                (7, 2, 'Role', 'Read,Write,Update,Delete', 15, 1),
                (8, 2, 'Role', 'Read', 1, 1),
                (9, 2, 'Role', 'Read,Write,Update,Delete', 15, 1),
                (11, 2, 'Role', 'Write', 2, 1),
                (1, 6, 'Role', 'Read,Write,Update', 15, 1),
                (2, 6, 'Role', 'Read', 15, 1),
                (5, 6, 'Role', 'Read,Write,Update,Delete', 15, 1),
                (8, 6, 'Role', 'Read', 1, 1),
                (9, 6, 'Role', 'Read,Write,Update,Delete', 15, 1),
                (11, 6, 'Role', 'Write', 2, 1),
                (1, 4, 'Role', 'Read,Write,Update', 15, 1),
                (2, 4, 'Role', 'Read', 15, 1),
                (5, 4, 'Role', 'Read,Write,Update,Delete', 15, 1),
                (8, 4, 'Role', 'Read', 1, 1),
                (9, 4, 'Role', 'Read,Write,Update,Delete', 15, 1),
                (11, 4, 'Role', 'Write', 2, 1);
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DELETE FROM aclmodulepermissions 
            WHERE "aclmodulesId" IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
        `);
  }
}
