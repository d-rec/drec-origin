import {MigrationInterface, QueryRunner} from "typeorm";

export class DeviceGroupNewIdField1663219743369 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "device_group" 
        ADD "devicegroup_uid" uuid NOT NULL DEFAULT uuid_generate_v4(),
        ADD  "countryCode" character varying
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
