import {MigrationInterface, QueryRunner} from "typeorm";

export class updateAndcopyColumn1684472228595 implements MigrationInterface {
    name = 'updateAndcopyColumn1684472228595';
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE device_group ADD COLUMN "countryCode_new" text[]`,
        );
        await queryRunner.query(
            `UPDATE device_group SET "countryCode_new" = ARRAY["countryCode"] WHERE "countryCode" IS NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE device_group DROP COLUMN "countryCode"`,
        );
        await queryRunner.query(
            `ALTER TABLE device_group RENAME COLUMN "countryCode_new" TO "countryCode"`,
        );
        await queryRunner.query(
            `ALTER TABLE device_group ADD COLUMN "fuelCode_new" text[]`,
        );
        await queryRunner.query(
            `UPDATE device_group SET "fuelCode_new" = ARRAY["fuelCode"] WHERE "fuelCode" IS NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE device_group DROP COLUMN "fuelCode"`,
        );
        await queryRunner.query(
            `ALTER TABLE device_group RENAME COLUMN "fuelCode_new" TO "fuelCode"`,
        );
    }


    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
