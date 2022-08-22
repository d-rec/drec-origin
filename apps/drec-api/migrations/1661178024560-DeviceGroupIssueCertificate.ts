import {MigrationInterface, QueryRunner} from "typeorm";

export class DeviceGroupIssueCertificate1661178024560 implements MigrationInterface {
    name = 'DeviceGroupIssueCertificate1661178024560';
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS public.devicegroup_issue_certificate
            (
                id SERIAL NOT NULL,
                "groupId" integer,
                start_date date,
                end_date date,
                CONSTRAINT devicegroup_issue_certificate_pkey PRIMARY KEY (id)
            )
            `,
          );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
