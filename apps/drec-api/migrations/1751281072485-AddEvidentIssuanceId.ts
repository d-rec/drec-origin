import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEvidentIssuanceId1751281072485 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE public.check_certificate_issue_date_log_for_device
            ADD COLUMN "evident_issuance_request_id" character varying DEFAULT NULL
    `);

    await queryRunner.query(
      `ALTER TABLE public.check_certificate_issue_date_log_for_device
          ADD "evident_issuance_request_status" character varying DEFAULT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE public.check_certificate_issue_date_log_for_device
        DROP
        COLUMN "evident_issuance_request_id"
    `);

    await queryRunner.query(`
        ALTER TABLE public.check_certificate_issue_date_log_for_device
        DROP
        COLUMN "evident_issuance_request_status"
    `);
  }
}
