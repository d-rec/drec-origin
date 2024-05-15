import { MigrationInterface, QueryRunner } from 'typeorm';

export class apiUserIdtableandcolumn1695380379771
  implements MigrationInterface
{
  name = 'apiUserIdtableandcolumn1695380379771';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE TABLE api_user (
          api_user_id uuid NOT NULL DEFAULT uuid_generate_v4(),
          "permissionIds" character varying,
           Permission_status character varying DEFAULT 'Request'
           )
          `);
    await queryRunner.query(`ALTER TABLE "organization" 
          ADD "api_user_id" uuid NOT NULL DEFAULT uuid_generate_v4()
          `);
    await queryRunner.query(`ALTER TABLE "user" 
          ADD "api_user_id" uuid NOT NULL DEFAULT uuid_generate_v4()
          `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE api_user`);
        await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "api_user_id"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "api_user_id"`);    
  }
}
