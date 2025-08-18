import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateEvidentIssuerTable1755550355205 implements MigrationInterface {
    name = 'CreateEvidentIssuerTable1755550355205'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "evident_issuer" (
                "id" SERIAL PRIMARY KEY,
                "name" VARCHAR(255) NOT NULL,
                "email" VARCHAR(255) NOT NULL,
                "country" VARCHAR(255) NOT NULL,
                "address" VARCHAR(255) NOT NULL, 
                "created_at" TIMESTAMP DEFAULT NOW(),
                "updated_at" TIMESTAMP DEFAULT NOW()
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "evident_issuer"
        `);
    }

}
