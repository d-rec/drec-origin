import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIssuanceStartDateAndEndDateOnMeterReadsTable1753342114903
  implements MigrationInterface
{
  name = 'AddIssuanceStartDateAndEndDateOnMeterReadsTable1753342114903';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "meter_reads" ADD "issuance_start_date" TIMESTAMP NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "meter_reads" ADD "issuance_end_date" TIMESTAMP NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "meter_reads" DROP COLUMN "issuance_start_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meter_reads" DROP COLUMN "issuance_end_date"`,
    );
  }
}
