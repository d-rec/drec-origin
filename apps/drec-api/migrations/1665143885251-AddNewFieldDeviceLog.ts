import {MigrationInterface, QueryRunner} from "typeorm";

export class AddNewFieldDeviceLog1665143885251 implements MigrationInterface {
    name = 'AddNewFieldDeviceLog1665143885251';
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "check_certificate_issue_date_log_for_device" 
        ADD "groupid" integer`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
 