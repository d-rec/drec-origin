import {MigrationInterface, QueryRunner} from "typeorm";

export class addDeveloperExternalId1676611071793 implements MigrationInterface {
    name = 'addDeveloperExternalId1676611071793';
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "device" ADD "developerExternalId" TYPE citext`);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
