import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameApiUserToMarketIntermediary1743609600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update role values
    await queryRunner.query(`UPDATE "user" SET role = 'MarketIntermediary' WHERE role = 'ApiUser'`);
    await queryRunner.query(`UPDATE user_role SET name = 'MarketIntermediary' WHERE name = 'ApiUser'`);
    await queryRunner.query(`UPDATE organization SET "organizationType" = 'MarketIntermediary' WHERE "organizationType" = 'ApiUser'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "user" SET role = 'ApiUser' WHERE role = 'MarketIntermediary'`);
    await queryRunner.query(`UPDATE user_role SET name = 'ApiUser' WHERE name = 'MarketIntermediary'`);
    await queryRunner.query(`UPDATE organization SET "organizationType" = 'ApiUser' WHERE "organizationType" = 'MarketIntermediary'`);
  }
}
