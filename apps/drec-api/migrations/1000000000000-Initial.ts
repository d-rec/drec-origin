/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1000000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {}
}
