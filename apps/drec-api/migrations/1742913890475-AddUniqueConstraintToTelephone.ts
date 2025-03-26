import {MigrationInterface, QueryRunner} from "typeorm";

export class AddUniqueConstraintToTelephone1742913890475 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "user" ADD CONSTRAINT "UQ_user_telephone" UNIQUE ("telephone")`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "user" DROP CONSTRAINT "UQ_user_telephone"`
        );
    }

}
