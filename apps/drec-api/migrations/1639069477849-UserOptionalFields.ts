import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserOptionalFields1639069477849 implements MigrationInterface {
  name = 'UserOptionalFields1639069477849';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "title" DROP NOT NULL`,
    );
    await queryRunner.query(`COMMENT ON COLUMN "user"."title" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "telephone" DROP NOT NULL`,
    );
    await queryRunner.query(`COMMENT ON COLUMN "user"."telephone" IS NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`COMMENT ON COLUMN "user"."telephone" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "telephone" SET NOT NULL`,
    );
    await queryRunner.query(`COMMENT ON COLUMN "user"."title" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "title" SET NOT NULL`,
    );
  }
}
