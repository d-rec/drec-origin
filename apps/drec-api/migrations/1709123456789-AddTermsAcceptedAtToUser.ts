import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTermsAcceptedAtToUser1709123456789 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "public"."user"
            ADD COLUMN "termsAcceptedAt" TIMESTAMP WITH TIME ZONE DEFAULT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "public"."user"
            DROP COLUMN "termsAcceptedAt"
        `);
    }
}