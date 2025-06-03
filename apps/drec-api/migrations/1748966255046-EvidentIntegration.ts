import { MigrationInterface, QueryRunner } from 'typeorm';

export class EvidentIntegration1748966255046 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE evident_integration (
              id SERIAL NOT NULL PRIMARY KEY,
              organization_id INTEGER NOT NULL UNIQUE,
              api_key TEXT NOT NULL,
              default_trading_account VARCHAR(255) NOT NULL,
              default_beneficiary_account VARCHAR(255) NOT NULL,
              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              CONSTRAINT fk_organization FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE
            );
          `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE evident_integration;`);
  }
}
