import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailVerifiedAtColumn1742913890480
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN "email_verified_at" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "email_verified_at"`,
    );
  }
}
