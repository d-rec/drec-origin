import { Injectable } from '@nestjs/common';
import { getConnection } from 'typeorm';

@Injectable()
export class TestingService {
  async clearDatabase() {
    const connection = getConnection();
    const queryRunner = connection.createQueryRunner();

    await queryRunner.connect();

    try {
      await queryRunner.startTransaction();

      // Disable referential integrity for PostgreSQL
      await queryRunner.query('SET session_replication_role = replica;');

      // List all tables in the public schema
      const tables = await queryRunner.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public';
      `);

      for (const table of tables) {
        const tableName = table.tablename;
        await queryRunner.query(`TRUNCATE TABLE "${tableName}" CASCADE;`);
      }

      // Re-enable referential integrity
      await queryRunner.query('SET session_replication_role = DEFAULT;');

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Error clearing database: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }
}
