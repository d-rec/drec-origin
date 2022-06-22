import { MigrationInterface, QueryRunner } from "typeorm";

export class OrganizationUpdatingdropschema1655904568851 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "organization" ADD "orgEmail" character varying NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "organization" ADD "organizationType"  character varying NOT NULL`,
        );
        await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "signatoryFullName", DROP COLUMN "signatoryAddress", DROP COLUMN "signatoryZipCode",DROP COLUMN "signatoryCity",DROP COLUMN "signatoryCountry",DROP COLUMN "signatoryPhoneNumber",DROP COLUMN "signatoryEmail"`
        );

    }
    public async down(queryRunner: QueryRunner): Promise<void> {

    }

}
