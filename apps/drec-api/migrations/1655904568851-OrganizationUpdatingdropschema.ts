import {MigrationInterface, QueryRunner} from "typeorm";

export class OrganizationUpdatingdropschema1655904568851 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "organization" ADD "orgEmail" character varying NOT NULL`,
          );
          await queryRunner.query(
            `ALTER TABLE "organization" ADD "organizationType"  character varying NOT NULL`,
          );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "signatoryFullName"`);
        await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "signatoryAddress"`);
        await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "signatoryZipCode"`);
        await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "signatoryCity"`);
        await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "signatoryCountry"`);
        await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "signatoryPhoneNumber"`);
        await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "signatoryEmail"`);
    }

}
