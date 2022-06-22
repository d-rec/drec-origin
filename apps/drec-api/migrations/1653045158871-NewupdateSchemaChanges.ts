import { MigrationInterface, QueryRunner } from 'typeorm';

export class NewupdateSchemaChanges1653045158871 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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
      `CREATE TABLE "aclmodulepermissions" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),"updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL,"aclmodulesId" integer,"entityId" integer,"entityType" "aclmodulepermissions_entityType_enum" NOT NULL,"permissions" character varying NOT NULL,"permissionValue" integer NOT NULL,"updatedBy" integer)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
