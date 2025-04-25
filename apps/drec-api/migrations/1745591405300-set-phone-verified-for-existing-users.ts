import { MigrationInterface, QueryRunner } from 'typeorm';

export class setPhoneVerifiedForExistingUsers1745591405300
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            UPDATE public."user"
            SET is_phone_verified = true
            WHERE is_phone_verified = false
          `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE public."user"
            ALTER COLUMN is_phone_verified DROP DEFAULT
          `);
  }
}
