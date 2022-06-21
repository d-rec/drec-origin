import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeviceUpatingFields1652770525953 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "device_description_enum" AS ENUM('Solar Lantern', 'Solar Home System', 'Mini Grid', 'Rooftop Solar', 'Ground Mount Solar'
            );`,
    );
    await queryRunner.query(`ALTER TABLE "device" 
        ADD COlUMN "deviceDescription" device_description_enum; 
        `);
    await queryRunner.query(`ALTER TABLE "device" 
        ADD COLUMN "energyStorage" boolean;`);
    await queryRunner.query(`ALTER TABLE "device" 
        ADD COLUMN "energyStorageCapacity" integer;`);
    await queryRunner.query(`ALTER TABLE "device" 
        ADD COLUMN "qualityLabels" character varying;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
