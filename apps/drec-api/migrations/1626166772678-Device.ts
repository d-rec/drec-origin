import { MigrationInterface, QueryRunner } from 'typeorm';

export class Device1626166772678 implements MigrationInterface {
  name = 'Device1626166772678';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "device" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" integer NOT NULL, "status" character varying NOT NULL DEFAULT 'Active', "project_name" character varying NOT NULL, "address" character varying NOT NULL, "latitude" character varying NOT NULL, "longitude" character varying NOT NULL, "fuel_code" character varying NOT NULL, "device_type_code" character varying NOT NULL, "installation_configuration" character varying NOT NULL, "capacity" character varying NOT NULL, "commissioning_date" character varying NOT NULL, "grid_interconnection" boolean NOT NULL, "off_taker" character varying NOT NULL, "sector" character varying NOT NULL, "standard_compliance" character varying NOT NULL, "generators_ids" integer array, "labels" character varying, "impact_story" character varying, "data" character varying, "images" text array, CONSTRAINT "PK_2dc10972aa4e27c01378dad2c72" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "device"`);
  }
}
