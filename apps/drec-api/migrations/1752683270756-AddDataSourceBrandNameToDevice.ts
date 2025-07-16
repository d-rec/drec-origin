import {MigrationInterface, QueryRunner} from "typeorm";

export class AddDataSourceBrandNameToDevice1752683270756 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "device"
            ADD COLUMN "data_source_brand_name" character varying;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "device"
            DROP COLUMN "data_source_brand_name";
        `);
    }

}
