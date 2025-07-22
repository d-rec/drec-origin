import {MigrationInterface, QueryRunner} from "typeorm";

export class MigrateHistoricalReadsToMeterReadsTable1753195189558 implements MigrationInterface {
    name = 'MigrateHistoricalReadsToMeterReadsTable1753195189558'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`INSERT INTO public.meter_reads(
            external_id, type, value, unit, start_date, end_date
            )
            SELECT 
            "externalId", type, "readsvalue", unit, "readsStartDate", "readsEndDate"
            FROM public.history_intermediate_meteread`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM public.meter_reads WHERE external_id IN (SELECT "externalId" FROM public.history_intermediate_meteread)`)
    }

}
