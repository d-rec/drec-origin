import { MigrationInterface, QueryRunner } from 'typeorm';

export class Sdgbenefit1663329270791 implements MigrationInterface {
  name = 'Sdgbenefit1663329270791';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS public.sdgbenefit
            (
                id SERIAL NOT NULL,
                "SdgbenefitName" character varying NOT NULL,
                "sdgbenefitdescription" character varying,               
                "sdgbenefitBitposition" integer,                
                "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                CONSTRAINT sdgbenefit_pkey PRIMARY KEY (id)
            )
            `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.sdgbenefit`);
  }
}
