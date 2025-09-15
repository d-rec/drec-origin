import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateDeviceGroupType1755174541318 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            UPDATE "device_group"
            SET "type" = 'multiple'
            WHERE "type" IS NULL;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            UPDATE "device_group"
            SET "type" = NULL
            WHERE "type" = 'multiple';
        `);
  }
}
