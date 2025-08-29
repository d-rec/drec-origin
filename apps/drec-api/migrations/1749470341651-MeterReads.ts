import { MigrationInterface, QueryRunner } from 'typeorm';

export class MeterReads1749470341651 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS citext`);

    await queryRunner.query(`
                    CREATE TABLE "meter_reads" (
                        "id" SERIAL PRIMARY KEY,
                        "external_id" citext NOT NULL,
                        "type" VARCHAR NOT NULL,
                        "value" DOUBLE PRECISION NOT NULL,
                        "unit" VARCHAR NOT NULL,
                        "start_date" TIMESTAMP NOT NULL,
                        "end_date" TIMESTAMP NOT NULL,
                        "certified" BOOLEAN DEFAULT FALSE,
                        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
                        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
                    )
                `);

    await queryRunner.query(`
                    CREATE INDEX "idx_meter_reads_external_id" 
                    ON "meter_reads" ("external_id")
                `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "meter_reads"`);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_meter_reads_external_id"`,
    );
  }
}
