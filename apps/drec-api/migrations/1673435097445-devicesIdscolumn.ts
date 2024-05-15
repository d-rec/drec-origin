import { MigrationInterface, QueryRunner } from 'typeorm';

export class devicesIdscolumn1673435097445 implements MigrationInterface {
  name = 'devicesIdscolumn1673435097445';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device_group" ADD "deviceIds" character varying `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "device_group" DROP COLUMN "deviceIds"`);
  }
}
