import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserAndOrgs1625491714119 implements MigrationInterface {
  name = 'UserAndOrgs1625491714119';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
  }
}
