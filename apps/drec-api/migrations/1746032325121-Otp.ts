import { MigrationInterface, QueryRunner } from 'typeorm';

export class Otp1746032325121 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "otp" (
              id SERIAL NOT NULL PRIMARY KEY,
              "phone_number" varchar NOT NULL,
              "code" varchar NOT NULL,
              "expiration_time" bigint NOT NULL,
              "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
              "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "otp"
        `);
  }
}
