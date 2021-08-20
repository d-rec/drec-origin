import { MigrationInterface, QueryRunner } from 'typeorm';

export class SCHEMA1629471725361 implements MigrationInterface {
  name = 'SCHEMA1629471725361';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "device_group" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "name" character varying NOT NULL, "organizationId" integer NOT NULL, CONSTRAINT "UQ_f2ef78d341a5125990cafc9493c" UNIQUE ("name"), CONSTRAINT "PK_6bb808be579ff0722c914a8d6a1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "device" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "drecID" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'Active', "organizationId" integer NOT NULL, "projectName" character varying NOT NULL, "address" character varying NOT NULL, "latitude" character varying NOT NULL, "longitude" character varying NOT NULL, "countryCode" character varying NOT NULL, "zipCode" integer, "fuelCode" character varying NOT NULL, "deviceTypeCode" character varying NOT NULL, "installationConfiguration" character varying NOT NULL, "capacity" integer NOT NULL, "commissioningDate" character varying NOT NULL, "gridInterconnection" boolean NOT NULL, "offTaker" character varying NOT NULL, "sector" character varying NOT NULL, "standardCompliance" character varying NOT NULL, "yieldValue" integer NOT NULL DEFAULT '1000', "generatorsIds" integer array, "labels" character varying, "impactStory" character varying, "data" character varying, "images" text DEFAULT '[]', "groupId" integer, CONSTRAINT "UQ_a93bf3af71fa160724c7ae04a2e" UNIQUE ("drecID"), CONSTRAINT "PK_2dc10972aa4e27c01378dad2c72" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "file" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "filename" character varying NOT NULL, "data" bytea NOT NULL, "contentType" character varying NOT NULL, "userId" character varying NOT NULL, "organizationId" character varying, "isPublic" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_36b46d232307066b3a2c9ea3a1d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "organization" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "name" character varying NOT NULL, "address" character varying NOT NULL, "zipCode" character varying NOT NULL, "city" character varying NOT NULL, "country" character varying NOT NULL, "blockchainAccountAddress" character varying, "businessType" character varying NOT NULL, "tradeRegistryCompanyNumber" character varying NOT NULL, "vatNumber" character varying NOT NULL, "signatoryFullName" character varying NOT NULL, "signatoryAddress" character varying NOT NULL, "signatoryZipCode" character varying NOT NULL, "signatoryCity" character varying NOT NULL, "signatoryCountry" character varying NOT NULL, "signatoryEmail" character varying NOT NULL, "signatoryPhoneNumber" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'Submitted', CONSTRAINT "UQ_bec683182179a2132591a2726b3" UNIQUE ("blockchainAccountAddress"), CONSTRAINT "PK_472c1f99a32def1b0abb219cd67" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "title" character varying, "firstName" character varying, "lastName" character varying, "telephone" character varying, "email" character varying NOT NULL, "password" character varying NOT NULL, "notifications" boolean, "status" character varying DEFAULT 'Pending', "role" character varying NOT NULL, "organizationId" integer NOT NULL, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "organization"`);
    await queryRunner.query(`DROP TABLE "file"`);
    await queryRunner.query(`DROP TABLE "device"`);
    await queryRunner.query(`DROP TABLE "device_group"`);
  }
}
