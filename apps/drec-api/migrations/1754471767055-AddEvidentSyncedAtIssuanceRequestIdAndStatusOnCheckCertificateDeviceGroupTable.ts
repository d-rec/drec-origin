import {MigrationInterface, QueryRunner} from "typeorm";

export class AddEvidentSyncedAtIssuanceRequestIdAndStatusOnCheckCertificateDeviceGroupTable1754471767055 implements MigrationInterface {
    name = 'AddEvidentSyncedAtIssuanceRequestIdAndStatusOnCheckCertificateDeviceGroupTable1754471767055'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "check_certificate_issue_date_log_for_device_group" ADD "evident_synced_at" TIMESTAMP, ADD "evident_issuance_request_id" character varying, ADD "evident_issuance_request_status" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "check_certificate_issue_date_log_for_device_group" DROP COLUMN "evident_synced_at", DROP COLUMN "evident_issuance_request_id", DROP COLUMN "evident_issuance_request_status"`);
    }
}
