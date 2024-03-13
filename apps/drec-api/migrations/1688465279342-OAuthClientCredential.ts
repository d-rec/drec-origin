import { MigrationInterface, QueryRunner } from 'typeorm';

export class OAuthClientCredential1688465279342 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TABLE oauth_client_credentials (
            id SERIAL PRIMARY KEY,
            api_user_id uuid NOT NULL DEFAULT uuid_generate_v4(),
            client_id VARCHAR(255) UNIQUE NOT NULL,
            client_secret VARCHAR(255) NOT NULL
            
          );
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE client_credentials;');
  }
}
