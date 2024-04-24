import { MigrationInterface, QueryRunner } from 'typeorm';

export class ApiUserIdFieldDeviceGroup1700980514026
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "device_group" 
          ADD "api_user_id" uuid DEFAULT NULL
          `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
