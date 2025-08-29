import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFailedMeterReadsTable1756225096064
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS citext`);

    await queryRunner.query(`
                    CREATE TABLE "failed_meter_reads" (
                        "id" SERIAL PRIMARY KEY,
                        "external_id" citext NOT NULL,
                        "type" VARCHAR NOT NULL,
                        "value" DOUBLE PRECISION NOT NULL,
                        "unit" VARCHAR NOT NULL,
                        "start_date" TIMESTAMP NOT NULL,
                        "end_date" TIMESTAMP NOT NULL,
                        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
                        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
                    )
                `);

    await queryRunner.query(`
                    CREATE INDEX "idx_failed_meter_reads_external_id" 
                    ON "failed_meter_reads" ("external_id")
                `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "failed_meter_reads"`);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_failed_meter_reads_external_id"`,
    );
  }
}
