import {MigrationInterface, QueryRunner} from "typeorm";

export class IntermideatryTableFields1658924656241 implements MigrationInterface {
    name = 'IntermideatryTableFields1658924656241';
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS aggregate_meterread
            (
                "id" SERIAL NOT NULL ,
                "value" integer,
                "deltaValue" integer,
                "createdAt" timestamp with time zone,
                "updatedAt" timestamp with time zone,
                "deviceId" character(20),
                datetime character(1),
                CONSTRAINT aggregate_meterread_pkey PRIMARY KEY (id)
            )`,
          );
          await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS intermediate_meterread
            (
                "id" SERIAL NOT NULL ,
                "type" character varying,
                "createdAt" timestamp with time zone,
                "updatedAt" timestamp with time zone,
                "unit" character varying,
                "deviceId" character(20),
                CONSTRAINT intermediate_meterread_pkey PRIMARY KEY (id)
            )`,
          );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
