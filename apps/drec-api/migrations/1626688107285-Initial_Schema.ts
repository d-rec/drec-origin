import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1626688107285 implements MigrationInterface {
  name = 'InitialSchema1626688107285';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "device" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "drecID" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'Active', "registrant_organisation_code" character varying NOT NULL, "project_name" character varying NOT NULL, "address" character varying NOT NULL, "latitude" character varying NOT NULL, "longitude" character varying NOT NULL, "country_code" character varying NOT NULL, "zip_code" integer, "fuel_code" character varying NOT NULL, "device_type_code" character varying NOT NULL, "installation_configuration" character varying NOT NULL, "capacity" integer NOT NULL, "commissioning_date" character varying NOT NULL, "grid_interconnection" boolean NOT NULL, "off_taker" character varying NOT NULL, "sector" character varying NOT NULL, "standard_compliance" character varying NOT NULL, "yield_value" integer NOT NULL DEFAULT '1000', "generators_ids" integer array, "labels" character varying, "impact_story" character varying, "data" character varying, "images" text array, CONSTRAINT "UQ_a93bf3af71fa160724c7ae04a2e" UNIQUE ("drecID"), CONSTRAINT "PK_2dc10972aa4e27c01378dad2c72" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "file" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "filename" character varying NOT NULL, "data" bytea NOT NULL, "contentType" character varying NOT NULL, "userId" character varying NOT NULL, "organizationId" character varying, "isPublic" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_36b46d232307066b3a2c9ea3a1d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "organization" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "code" character varying NOT NULL, "name" character varying NOT NULL, "address" character varying NOT NULL, "primaryContact" character varying NOT NULL, "telephone" character varying NOT NULL, "email" character varying NOT NULL, "regNumber" character varying NOT NULL, "vatNumber" character varying NOT NULL, "regAddress" character varying NOT NULL, "country" character varying NOT NULL, "blockchainAccountAddress" character varying NOT NULL, "role" character varying NOT NULL, CONSTRAINT "UQ_bec683182179a2132591a2726b3" UNIQUE ("blockchainAccountAddress"), CONSTRAINT "PK_aa6e74e96ed2dddfcf09782110a" PRIMARY KEY ("code"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "username" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "organizationId" character varying NOT NULL, CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "UQ_dfda472c0af7812401e592b6a61" UNIQUE ("organizationId"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "organization"`);
    await queryRunner.query(`DROP TABLE "file"`);
    await queryRunner.query(`DROP TABLE "device"`);
  }
}
