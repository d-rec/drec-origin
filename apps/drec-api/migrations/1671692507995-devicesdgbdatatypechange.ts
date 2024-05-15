import { MigrationInterface, QueryRunner } from 'typeorm';

export class devicesdgbdatatypechange1671692507995
  implements MigrationInterface
{
  name = 'devicesdgbdatatypechange1671692507995';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" ALTER COLUMN "SDGBenefits" TYPE character varying `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "device" ALTER COLUMN "SDGBenefits" TYPE jsonb`);
  }
}
