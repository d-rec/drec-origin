import {MigrationInterface, QueryRunner} from "typeorm";

export class NewupdateSchemaChanges1653045158871 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "user_role" ADD "description" character varying`,
          );
          await queryRunner.query(
            `ALTER TABLE "user_role" ADD "status" character varying`,
          );
          await queryRunner.query(
            `ALTER TABLE "user" ADD "roleId" character varying`,
          );
          await queryRunner.query(
            `CREATE TABLE "aclmodules" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),"updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),"id" SERIAL NOT NULL,"name" character varying NOT NULL,"description" character varying NOT NULL, "status" character varying NOT NULL,"permissions" character varying NOT NULL,"permissionValue" integer NOT NULL)`,
          );
          await queryRunner.query(
            `CREATE TABLE "aclmodulepermissions" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),"updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL,"aclmodulesId" integer,"entityId" integer,"entityType" AS ENUM('Role', 'User'),"permissions" character varying NOT NULL,"permissionValue" integer NOT NULL,"updatedBy" integer)`,
          );
         
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
