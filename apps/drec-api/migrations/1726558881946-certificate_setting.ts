import { MigrationInterface, QueryRunner } from 'typeorm';

export class certificateSetting1726558881946 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE certificate_setting (
                id SERIAL PRIMARY KEY,
                "no_of_days" integer NOT NULL DEFAULT 60,
                "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp with time zone NOT NULL DEFAULT now()
               )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS certificate_setting`);
  }
}
