import { MigrationInterface, QueryRunner } from 'typeorm';

export class Secretkeyremove1681791249032 implements MigrationInterface {
  name = 'Secretkeyremove1681791249032';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "secretKey"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
