import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameTelephoneToPhoneNumberAndAddUniqueConstraint1742913890475
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" RENAME COLUMN "telephone" TO "phone_number"`,
    );

    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_user_phone_number" UNIQUE ("phone_number")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "UQ_user_phone_number"`,
    );

    await queryRunner.query(
      `ALTER TABLE "user" RENAME COLUMN "phone_number" TO "telephone"`,
    );
  }
}
