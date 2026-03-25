import { MigrationInterface, QueryRunner } from 'typeorm';

export class SubmissionStatusToEnum1757000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "submission_status_enum" AS ENUM ('pending', 'approved', 'rejected')`,
    );
    await queryRunner.query(`
      ALTER TABLE "submissions"
        ALTER COLUMN "status" DROP DEFAULT,
        ALTER COLUMN "status" TYPE "submission_status_enum"
          USING "status"::"submission_status_enum",
        ALTER COLUMN "status" SET DEFAULT 'pending'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "submissions"
        ALTER COLUMN "status" DROP DEFAULT,
        ALTER COLUMN "status" TYPE VARCHAR USING "status"::text,
        ALTER COLUMN "status" SET DEFAULT 'pending'
    `);
    await queryRunner.query(`DROP TYPE "submission_status_enum"`);
  }
}
