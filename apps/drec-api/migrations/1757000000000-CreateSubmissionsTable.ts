import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubmissionsTable1757000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "submissions" (
        "id"                 SERIAL PRIMARY KEY,
        "project_subfolder"  VARCHAR NOT NULL,
        "submitted_at"       TIMESTAMP WITH TIME ZONE NOT NULL,
        "reviewer_name"      VARCHAR,
        "status"             VARCHAR NOT NULL DEFAULT 'pending',
        "created_at"         TIMESTAMP WITH TIME ZONE DEFAULT now(),
        "updated_at"         TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "submissions"`);
  }
}
