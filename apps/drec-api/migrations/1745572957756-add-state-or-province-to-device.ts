import { MigrationInterface, QueryRunner } from 'typeorm';

export class addStateOrProvinceToDevice1745572957756
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" ADD COLUMN "state_province" character varying NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" DROP COLUMN "state_province"`,
    );
  }
}
