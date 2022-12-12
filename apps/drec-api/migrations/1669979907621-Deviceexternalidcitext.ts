import {MigrationInterface, QueryRunner} from "typeorm";

export class Deviceexternalidcitext1669979907621 implements MigrationInterface {
 name = 'Deviceexternalidcitext1669979907621';
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS citext`);
        await queryRunner.query(`ALTER TABLE "device" ALTER COLUMN "externalId" TYPE citext`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
