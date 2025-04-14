import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddisPhoneVerifiedStatus1744269974495
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "isPhoneVerified" boolean DEFAULT false `,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "phone_number_verified_at" TIMESTAMP WITH TIME ZONE DEFAULT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isPhoneVerified"`);
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN 'phone_number_verified_at'`,
    );
  }
}
