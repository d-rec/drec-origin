import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoboflowWorkflowUrl1760600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "org_api_licenses"
       ADD COLUMN IF NOT EXISTS "roboflow_workflow_url" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "org_api_licenses"
       DROP COLUMN IF EXISTS "roboflow_workflow_url"`,
    );
  }
}
