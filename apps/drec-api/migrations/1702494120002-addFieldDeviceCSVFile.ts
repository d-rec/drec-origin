import { MigrationInterface, QueryRunner } from 'typeorm';

export class addFieldDeviceCSVFile1702494120002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "device_csv_file_processing_jobs"
        ADD "api_user_id" uuid DEFAULT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "device_csv_file_processing_jobs"
      DROP COLUMN "api_user_id"
    `);
  }
}
