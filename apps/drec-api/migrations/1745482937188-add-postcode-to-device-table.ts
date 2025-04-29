import { MigrationInterface, QueryRunner } from 'typeorm';

export class addPostcodeToDeviceTable1745482937188
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN "postcode" character varying DEFAULT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "device" DROP COLUMN "postcode"`);
  }
}
