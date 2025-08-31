import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateHistoricalReadsToMeterReadsTable1753430558252
  implements MigrationInterface
{
  name = 'MigrateHistoricalReadsToMeterReadsTable1753430558252';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`INSERT INTO public.meter_reads(
            external_id, type, value, unit, start_date, end_date, certified, issuance_start_date, issuance_end_date, created_at
            )
            SELECT 
            "externalId", type, "readsvalue", unit, "readsStartDate", "readsEndDate", "certificate_issued", "certificate_issuance_startdate", "certificate_issuance_enddate", "createdAt"
            FROM public.history_intermediate_meteread`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM public.meter_reads WHERE external_id IN (SELECT "externalId" FROM public.history_intermediate_meteread)`,
    );
  }
}
