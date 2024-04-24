import { MigrationInterface, QueryRunner } from 'typeorm';

export class HistoryIntermideateFirlds1665490980305
  implements MigrationInterface
{
  name = 'HistoryIntermideateFirlds1665490980305';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS public.history_intermediate_meteread
            (
                "id" SERIAL NOT NULL,
                "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "type" character varying,
                "unit" character varying,
                "readsvalue" double precision,
                "readsStartDate" timestamp with time zone,
                "readsEndDate"  timestamp with time zone,
                "deviceId" character varying,
                "groupId_certificate_issued_for" integer,
                "certificate_issued" boolean DEFAULT false,
                "issuer_certificate_id" integer,
                certificate_issuance_startdate timestamp with time zone,
                certificate_issuance_enddate timestamp with time zone,
                CONSTRAINT history_intermideate_meteread_pkey PRIMARY KEY (id)
            )`,
    );
    await queryRunner.query(`ALTER TABLE "device_group" 
          ADD "type" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
