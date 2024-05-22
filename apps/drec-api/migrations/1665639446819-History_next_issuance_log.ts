import { MigrationInterface, QueryRunner } from 'typeorm';

export class HistoryNextIssuanceLog1665639446819 implements MigrationInterface {
  name = 'HistoryNextIssuanceLog1665639446819';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS public.history_next_issueance_log
            (
                "id" SERIAL NOT NULL,
                "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "device_externalid" character varying,
                "groupId" integer,
                "reservationStartDate" timestamp with time zone,
                "reservationEndDate"  timestamp with time zone,   
                "status" character varying,     
                "device_createdAt" timestamp with time zone,
                CONSTRAINT history_next_issueance_log_pkey PRIMARY KEY (id)
            )`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS public.history_next_issuance_log`,
    );
  }
}
