import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReviewerRoles1757000000015 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO user_role (name, description, status)
      SELECT 'Reviewer', 'Reviewer role for device reviews', true
      WHERE NOT EXISTS (SELECT 1 FROM user_role WHERE name = 'Reviewer')
    `);
    await queryRunner.query(`
      INSERT INTO user_role (name, description, status)
      SELECT 'SeniorReviewer', 'Senior Reviewer role for device reviews', true
      WHERE NOT EXISTS (SELECT 1 FROM user_role WHERE name = 'SeniorReviewer')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM user_role WHERE name IN ('Reviewer', 'SeniorReviewer')
    `);
  }
}
