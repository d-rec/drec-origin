import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTermsAcceptedAtToUser1745858763089
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "public"."user"
            ADD COLUMN "terms_accepted_at" TIMESTAMP WITH TIME ZONE DEFAULT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "public"."user"
              DROP COLUMN "termsAcceptedAt"
          `);
  }
}
