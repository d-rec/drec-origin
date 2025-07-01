import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEvidentSyncedColumnToCertificates1750255349520
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE public.check_certificate_issue_date_log_for_device
            ADD COLUMN "evident_synced_at" TIMESTAMP WITH TIME ZONE DEFAULT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          ALTER TABLE public.check_certificate_issue_date_log_for_device
          DROP COLUMN "evident_synced_at"
        `);
  }
}
