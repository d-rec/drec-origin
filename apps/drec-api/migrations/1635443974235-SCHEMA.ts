import { MigrationInterface, QueryRunner } from 'typeorm';

export class SCHEMA1635443974235 implements MigrationInterface {
  name = 'SCHEMA1635443974235';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "device_group_standardcompliance_enum" AS ENUM('I-REC', 'REC', 'GO', 'TIGR')`,
    );
    await queryRunner.query(
      `CREATE TYPE "device_group_capacityrange_enum" AS ENUM('0-50watts', '51-500watts', '501watts-1kW', '1.001kW-50kW', '50.001kW-100kW', '100.001kW-1MW', '1.001MW+')`,
    );
    await queryRunner.query(
      `CREATE TYPE "device_description_enum" AS ENUM('Solar Lantern', 'Solar Home System', 'Mini Grid', 'Rooftop Solar', 'Ground Mount Solar'
            );`,
    );
    await queryRunner.query(
      `CREATE TABLE "device_group" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "name" character varying NOT NULL, "organizationId" integer NOT NULL, "fuelCode" character varying NOT NULL, "countryCode" character varying NOT NULL, "standardCompliance" "device_group_standardcompliance_enum" NOT NULL, "deviceTypeCodes" text array NOT NULL, "offTakers" text array NOT NULL, "installationConfigurations" text array NOT NULL, "sectors" text array NOT NULL, "commissioningDateRange" text array NOT NULL, "gridInterconnection" boolean NOT NULL, "aggregatedCapacity" integer NOT NULL, "capacityRange" "device_group_capacityrange_enum" NOT NULL, "yieldValue" integer NOT NULL DEFAULT '1000', "labels" text, "buyerId" integer, "buyerAddress" character varying, CONSTRAINT "UQ_f2ef78d341a5125990cafc9493c" UNIQUE ("name"), CONSTRAINT "PK_6bb808be579ff0722c914a8d6a1" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "organization_invitation" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "email" character varying NOT NULL, "role" character varying NOT NULL DEFAULT 'OrganizationUser', "status" character varying NOT NULL, "sender" character varying NOT NULL, "organizationId" integer,"permissionId" character varying, CONSTRAINT "PK_cc1ac752952740b92ead1ee9249" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "organization" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "name" character varying NOT NULL, "address" character varying, "zipCode" character varying , "city" character varying , "country" character varying , "blockchainAccountAddress" character varying, "blockchainAccountSignedMessage" character varying, "organizationType" character varying NOT NULL,"orgEmail" character varying NOT NULL, "signatoryDocumentIds" text, "status" character varying NOT NULL DEFAULT 'Submitted', "documentIds" text,"secretKey" character varying(6), CONSTRAINT "UQ_bec683182179a2132591a2726b3" UNIQUE ("blockchainAccountAddress"), CONSTRAINT "PK_472c1f99a32def1b0abb219cd67" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "device" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "externalId" character varying NOT NULL, "status" character varying DEFAULT 'Active', "organizationId" integer NOT NULL references organization(id), "projectName" character varying, "address" character varying , "latitude" character varying , "longitude" character varying , "countryCode" character varying, "fuelCode" character varying , "deviceTypeCode" character varying , "capacity" DOUBLE PRECISION, "commissioningDate" character varying, "gridInterconnection" boolean, "offTaker" character varying, "yieldValue" integer DEFAULT '1000', "labels" character varying, "impactStory" character varying, "data" character varying, "images" text,"deviceDescription" device_description_enum,"energyStorage" boolean,"energyStorageCapacity" DOUBLE PRECISION,"qualityLabels" character varying, "deviceOEM" character varying,"SDGBenefits" integer,"groupId" integer, CONSTRAINT "UQ_d0f3fa81825b4840499a7bd07ab" UNIQUE ("externalId"), CONSTRAINT "PK_2dc10972aa4e27c01378dad2c72" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "title" character varying , "firstName" character varying, "lastName" character varying, "telephone" character varying , "email" character varying NOT NULL, "password" character varying , "notifications" boolean, "status" character varying DEFAULT 'Pending', "role" character varying NOT NULL, "organizationId" integer, "roleId" integer,CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "email_confirmation" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "confirmed" boolean NOT NULL, "token" character varying NOT NULL, "expiryTimestamp" integer NOT NULL, "userId" integer, CONSTRAINT "REL_28d3d3fbd7503f3428b94fd18c" UNIQUE ("userId"), CONSTRAINT "PK_ff2b80a46c3992a0046b07c5456" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "file" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "filename" character varying NOT NULL, "data" bytea NOT NULL, "contentType" character varying NOT NULL, "userId" character varying NOT NULL, "organizationId" character varying, "isPublic" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_36b46d232307066b3a2c9ea3a1d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE  "developer_specific_manageGroupDevices_notFor_buyerReservation"(
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "id" SERIAL PRIMARY KEY     NOT NULL,
                "organizationId" integer NOT NULL references organization(id),
                "groupedByUserId" integer NOT NULL,    
                "name"           TEXT    NOT NULL,
                "deviceIds"   integer[]
                            
             );`,
    );

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS device_csv_file_processing_jobs
      (
          "jobId" SERIAL NOT NULL ,
          "fileId" character varying NOT NULL,
          "userId" integer NOT NULL,
          "organizationId" integer NOT NULL,
          status character varying(30) NOT NULL,
          "createdAt" timestamp with time zone DEFAULT now(),
          "updatedAt" timestamp with time zone DEFAULT now(),
          CONSTRAINT "DeviceCSVFileProcessingJobs_pkey" PRIMARY KEY ("jobId")
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS device_csv_processing_failed_rows
      (
          "id" SERIAL NOT NULL ,
          "jobId" integer,
          "createdAt" timestamp with time zone DEFAULT now(),
          "updatedAt" timestamp with time zone DEFAULT now(),
          "errorDetails" json,
          CONSTRAINT device_csv_processing_failed_rows_pkey PRIMARY KEY (id)
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "organization_invitation" ADD CONSTRAINT "FK_58d9ca5d9f882ad8be530d247f1" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_dfda472c0af7812401e592b6a61" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_confirmation" ADD CONSTRAINT "FK_28d3d3fbd7503f3428b94fd18cc" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "developer_specific_manageGroupDevices_notFor_buyerReservation" ADD CONSTRAINT "FK_24g3d3fbd7503f3428b94fd18cc" FOREIGN KEY ("groupedByUserId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "device_csv_file_processing_jobs" ADD CONSTRAINT "FK_98d9ca5d9f882ad8be530d247f1" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    // await queryRunner.query(
    //   `ALTER TABLE "device_csv_file_processing_jobs" ADD CONSTRAINT "FK_92d9ca5d9f882ad8be530d247f1" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    // );
    await queryRunner.query(
      `ALTER TABLE "device_csv_file_processing_jobs" ADD CONSTRAINT "FK_94d9ca5d9f882ad8be530d247f3" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "device_csv_processing_failed_rows" ADD CONSTRAINT "device_csv_processing_failed_rows_job_fkey" FOREIGN KEY ("jobId") REFERENCES "device_csv_file_processing_jobs"("jobId") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    // add new table Yieldconfig for all country is diffirent value
    await queryRunner.query(
      `CREATE TABLE "yieldconfig" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "countryName" character varying NOT NULL, "countryCode" character varying NOT NULL, "yieldValue" integer NOT NULL,"created_By" integer NOT NULL,"updated_By" integer,"status" character varying)`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_role" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "description" character varying , "status" boolean)`,
    );

    await queryRunner.query(
      `CREATE TABLE "aclmodules" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),"updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),"id" SERIAL NOT NULL,"name" character varying NOT NULL,"description" character varying NOT NULL, "status" character varying NOT NULL,"permissions" character varying NOT NULL,"permissionsValue" integer NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."aclmodulepermissions_entityType_enum" AS ENUM('Role', 'User')`,
    );
    await queryRunner.query(
      `CREATE TABLE "aclmodulepermissions" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),"updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL,"aclmodulesId" integer,"entityId" integer,"entityType" "aclmodulepermissions_entityType_enum" NOT NULL,"permissions" character varying NOT NULL,"permissionValue" integer NOT NULL,"updatedBy" integer,"status" integer NOT NULL DEFAULT '0')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "email_confirmation" DROP CONSTRAINT "FK_28d3d3fbd7503f3428b94fd18cc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_dfda472c0af7812401e592b6a61"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_invitation" DROP CONSTRAINT "FK_58d9ca5d9f882ad8be530d247f1"`,
    );
    await queryRunner.query(`DROP TABLE "file"`);
    await queryRunner.query(`DROP TABLE "email_confirmation"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "organization"`);
    await queryRunner.query(`DROP TABLE "organization_invitation"`);
    await queryRunner.query(`DROP TABLE "device"`);
    await queryRunner.query(`DROP TABLE "device_group"`);
    await queryRunner.query(`DROP TABLE "yieldconfig"`);
    await queryRunner.query(`DROP TYPE "device_group_capacityrange_enum"`);
    await queryRunner.query(`DROP TYPE "device_group_standardcompliance_enum"`);
  }
}
