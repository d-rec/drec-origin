import { MigrationInterface, QueryRunner } from 'typeorm';

export class NewupdateSchemaChanges1653045158871 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD "roleId" integer`);
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "secretKey" character varying(6)`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_role" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "description" character varying , "status" boolean)`,
    );

    await queryRunner.query(
      `CREATE TABLE "aclmodules" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),"updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),"id" SERIAL NOT NULL,"name" character varying NOT NULL,"description" character varying NOT NULL, "status" character varying NOT NULL,"permissions" character varying NOT NULL,"permissionValue" integer NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."aclmodulepermissions_entityType_enum" AS ENUM('Role', 'User')`,
    );
    await queryRunner.query(
      `CREATE TABLE "aclmodulepermissions" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),"updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL,"aclmodulesId" integer,"entityId" integer,"entityType" "aclmodulepermissions_entityType_enum" NOT NULL,"permissions" character varying NOT NULL,"permissionValue" integer NOT NULL,"updatedBy" integer,"status" integer NOT NULL DEFAULT '0')`,
    );
    await queryRunner.query(
      ` CREATE TABLE IF NOT EXISTS public.yieldconfig(
    "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
    "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
    id SERIAL NOT NULL,
    "countryName" character varying  NOT NULL,
    "countryCode" character varying  NOT NULL,
    "yieldValue" integer NOT NULL,
    "created_By" integer NOT NULL,
    "updated_By" integer,
    status character varying  NOT NULL DEFAULT 'Y'::character varying,
    CONSTRAINT yieldconfig_pkey PRIMARY KEY (id))`,
    );
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS public.user_role
    (
        id SERIAL NOT NULL,
        name character varying  NOT NULL,
        "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
        description character varying ,
        status boolean,
        CONSTRAINT user_role_pkey PRIMARY KEY (id)
    )`);

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS public.organization
(
    "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
    "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
    id SERIAL NOT NULL,name character varying  NOT NULL,address character varying ,"zipCode" character varying , city character varying,country character varying , "blockchainAccountAddress" character varying ,"blockchainAccountSignedMessage" character varying ,"organizationType" character varying  NOT NULL,"orgEmail" character varying , "signatoryDocumentIds" text , status character varying  NOT NULL DEFAULT 'Submitted'::character varying,"documentIds" text, "secretKey" character varying(6) , CONSTRAINT "PK_472c1f99a32def1b0abb219cd67" PRIMARY KEY (id),
    CONSTRAINT "UQ_bec683182179a2132591a2726b3" UNIQUE ("blockchainAccountAddress")
)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
