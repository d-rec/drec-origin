import {MigrationInterface, QueryRunner} from "typeorm";

export class addPostCodeToDeviceTable1745482937188 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "device" ADD COLUMN "post_code" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "device" DROP COLUMN "post_code"`);
    }

}
