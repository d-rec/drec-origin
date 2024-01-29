import {MigrationInterface, QueryRunner} from "typeorm";

export class IntermideatryTableFields1658924656241 implements MigrationInterface {
    name = 'IntermideatryTableFields1658924656241';
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS aggregate_meterread
            (
                "id" SERIAL NOT NULL ,
                "value" DOUBLE PRECISION,
                "deltaValue" DOUBLE PRECISION,
                "unit" character varying, 
                "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "deviceId" character varying,
                "datetime" character varying,
                CONSTRAINT aggregate_meterread_pkey PRIMARY KEY (id)
            )`,
          );
     
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
