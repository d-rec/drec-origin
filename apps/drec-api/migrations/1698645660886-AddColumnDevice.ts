import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddColumnDevice1698645660886 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "device" 
          ADD "api_user_id" uuid DEFAULT NULL
          `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
