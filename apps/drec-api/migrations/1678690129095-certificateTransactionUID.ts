import {MigrationInterface, QueryRunner} from "typeorm";

export class certificateTransactionUID1678690129095 implements MigrationInterface {
    name = 'certificateTransactionUID1678690129095';
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS citext`);
        await queryRunner.query(`ALTER TABLE "check_certificate_issue_date_log_for_device_group" ADD "certificateTransactionUID" citext`);
        await queryRunner.query(`ALTER TABLE "check_certificate_issue_date_log_for_device" ADD "certificateTransactionUID" citext`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
