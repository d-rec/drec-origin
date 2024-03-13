import { MigrationInterface, QueryRunner } from 'typeorm';

export class CheckcretificatelogforDeviceGroupField1663162320749
  implements MigrationInterface
{
  name = 'CheckcretificatelogforDeviceGroupField1663162320749';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS public.check_certificate_issue_date_log_for_device_group
            (
                id SERIAL NOT NULL,
                groupid integer,
                issuer_certificate_id integer,
                certificate_issuance_startdate timestamp with time zone,
                certificate_issuance_enddate timestamp with time zone,
                readvalue_watthour DOUBLE PRECISION,
                status character varying COLLATE pg_catalog."default",
                certificate_payload json,
                "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                CONSTRAINT check_certificate_issue_date_log_for_device_group_pkey PRIMARY KEY (id)
            )
            `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
