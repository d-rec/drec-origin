import { MigrationInterface, QueryRunner } from 'typeorm';

export class alterOAuthClientCredential1708000840858
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "oauth_client_credentials"
            ALTER COLUMN "client_id" TYPE TEXT`);

    await queryRunner.query(`ALTER TABLE "oauth_client_credentials"
            ALTER COLUMN "client_id" SET NOT NULL`);

    await queryRunner.query(`ALTER TABLE "oauth_client_credentials"
            ADD CONSTRAINT "UQ_oauth_client_credentials_client_id" UNIQUE ("client_id")`);

    await queryRunner.query(
      `ALTER TABLE "oauth_client_credentials" DROP COLUMN "client_secret"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "oauth_client_credentials" ADD COLUMN "client_secret" TEXT`,
    );
    await queryRunner.query(`ALTER TABLE "oauth_client_credentials"
        DROP CONSTRAINT "UQ_oauth_client_credentials_client_id"`);

    await queryRunner.query(`ALTER TABLE "oauth_client_credentials"
        ALTER COLUMN "client_id" DROP NOT NULL`);

    await queryRunner.query(`ALTER TABLE "oauth_client_credentials"
        ALTER COLUMN "client_id" TYPE VARCHAR`);
  }
}
