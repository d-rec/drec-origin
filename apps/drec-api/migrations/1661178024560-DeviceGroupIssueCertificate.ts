import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeviceGroupIssueCertificate1661178024560
  implements MigrationInterface
{
  name = 'DeviceGroupIssueCertificate1661178024560';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS public.next_issuance_date_log_for_device_group
            (
                id SERIAL NOT NULL,
                "groupId" integer,
                "start_date" character varying,
                "end_date" character varying,
                "unit" character varying,
                "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                CONSTRAINT devicegroup_issue_certificate_pkey PRIMARY KEY (id)
            )
            `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS public.next_issuance_date_log_for_device_group`,
    );
  }
}
