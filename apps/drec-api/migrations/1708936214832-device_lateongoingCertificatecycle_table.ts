import { MigrationInterface, QueryRunner } from 'typeorm';

export class deviceLateongoingCertificatecycleTable1708936214832
  implements MigrationInterface
{
  name = 'deviceLateongoingCertificatecycleTable1708936214832';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE TABLE device_lateongoing_certificate_cycle (
            id SERIAL PRIMARY KEY,
            "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
            "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
            "groupId" integer NOT NULL,
            "device_externalid" character varying,
            "late_start_date" character varying,
            "late_end_date" character varying,
            "certificate_issued" boolean DEFAULT false)`);
    await queryRunner.query(`ALTER TABLE "check_certificate_issue_date_log_for_device"
          ADD "ongoing_start_date" character varying,
          ADD "ongoing_end_date" character varying `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS device_lateongoing_certificate_cycle`);
    await queryRunner.query(`ALTER TABLE "check_certificate_issue_date_log_for_device"
          DROP COLUMN IF EXISTS "ongoing_start_date",
          DROP COLUMN IF EXISTS "ongoing_end_date"`);
  }
}
