import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFingerprintToDevice1746607956963 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN "fingerprint" character varying NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "device" DROP COLUMN "fingerprint"`);
  }
}
