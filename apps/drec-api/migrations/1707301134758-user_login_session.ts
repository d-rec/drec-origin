import {MigrationInterface, QueryRunner} from "typeorm";

export class userLoginSession1707301134758 implements MigrationInterface {
    name = 'userLoginSession1707301134758';
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
        CREATE TABLE user_login_session (
            id SERIAL PRIMARY KEY,
            "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
            "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),  
            "userId" integer NOT NULL,
            "accesstoken_hash" VARCHAR(255) NOT NULL

           )
          `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
