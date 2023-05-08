import {MigrationInterface, QueryRunner} from "typeorm";

export class addDeviceTimezone1683267973604 implements MigrationInterface {
    name = 'addDeviceTimezone1683267973604';
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "device" ADD COLUMN "timezone" character varying`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
