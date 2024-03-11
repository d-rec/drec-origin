import { MigrationInterface, QueryRunner } from 'typeorm';

export class deltaFirstread1669270905713 implements MigrationInterface {
  name = 'deltaFirstread1669270905713';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS public.delta_firstread
            (
                "id" SERIAL NOT NULL,
                "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "unit" character varying,
                "readsvalue" double precision,
                "readsEndDate" timestamp with time zone,
                "deviceId" character varying,
                CONSTRAINT delta_firstreadd_pkey PRIMARY KEY (id)
            )`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
