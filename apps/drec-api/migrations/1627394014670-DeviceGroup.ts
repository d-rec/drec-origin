import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeviceGroup1627394014670 implements MigrationInterface {
  name = 'DeviceGroup1627394014670';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "device_group" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "name" character varying NOT NULL, "organizationId" character varying NOT NULL, CONSTRAINT "UQ_f2ef78d341a5125990cafc9493c" UNIQUE ("name"), CONSTRAINT "PK_6bb808be579ff0722c914a8d6a1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "device" ADD "groupId" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "device" DROP COLUMN "groupId"`);
    await queryRunner.query(`DROP TABLE "device_group"`);
  }
}
