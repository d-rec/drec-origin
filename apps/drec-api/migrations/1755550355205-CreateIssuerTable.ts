import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIssuerTable1755550355205 implements MigrationInterface {
  name = 'CreateIssuerTable1755550355205';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "issuer" (
                "id" SERIAL PRIMARY KEY,
                "issuer_id" VARCHAR(255) NOT NULL UNIQUE,
                "name" VARCHAR(255) NOT NULL,
                "email" VARCHAR(255) NOT NULL,
                "country" VARCHAR(255) NOT NULL,
                "address" VARCHAR(255) NOT NULL, 
                "regions" TEXT[] NOT NULL,
                "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "issuer"
        `);
  }
}
