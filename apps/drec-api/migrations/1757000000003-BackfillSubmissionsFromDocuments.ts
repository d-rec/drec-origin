import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillSubmissionsFromDocuments1757000000003
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Extract the subfolder (5th path segment) from each document URL,
    // group so one submission row is created per unique project subfolder,
    // using the earliest document created_at as the submitted_at date.
    // Only process URLs that actually contain a subfolder (6th segment non-empty).
    await queryRunner.query(`
      INSERT INTO "submissions" ("project_subfolder", "submitted_at", "reviewer_name", "status")
      SELECT
        split_part(url, '/', 5)  AS project_subfolder,
        MIN(created_at)          AS submitted_at,
        NULL                     AS reviewer_name,
        'pending'                AS status
      FROM "documents"
      WHERE split_part(url, '/', 6) <> ''
      GROUP BY split_part(url, '/', 5)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "submissions"`);
  }
}
