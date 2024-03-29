import { MigrationInterface, QueryRunner } from 'typeorm';
import { checkColumnQuoting } from '../src/utils/get-migration-unquotedColumnQuery';

export class querfailError1710419707891 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const query = `
      CREATE TABLE api_user_test (
        "api_user_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "permissionIds" character varying,
        "Permission_status" character varying DEFAULT 'Request'
      )`;
    try {
      const unquotedColumnNames2 = await checkColumnQuoting(query);

      if (!unquotedColumnNames2) {
        throw new Error(`Missing double quotes in column names`);
      }
      await queryRunner.query(query);
      console.log('Table created successfully.');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(error.message);
      throw error;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
