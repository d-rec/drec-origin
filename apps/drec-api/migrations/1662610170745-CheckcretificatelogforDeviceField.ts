import {MigrationInterface, QueryRunner} from "typeorm";

export class CheckcretificatelogforDeviceField1662610170745 implements MigrationInterface {
    name = 'CheckcretificatelogforDeviceField1662610170745';
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS public.next_issuance_date_log_for_device_group
            (
                id SERIAL NOT NULL,
                "deviceid" character varying NOT NULL,
                "issuer_certificate_id" integer,
                "certificate_issuance_startdate" timestamp with time zone,
                "certificate_issuance_enddate" timestamp with time zone,
                "readvalue_watthour" integer,
                "status" character varying,
                "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                CONSTRAINT devicegroup_issue_certificate_pkey PRIMARY KEY (id)
            )
            `,
          );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
