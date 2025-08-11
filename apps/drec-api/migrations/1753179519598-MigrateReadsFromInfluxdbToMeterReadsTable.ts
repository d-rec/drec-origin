import { MigrationInterface, QueryRunner } from 'typeorm';
import { mapReadsToMeterReadsTableFormat } from '../src/lib/influx-db';
import { ReadType } from '../src/utils/enums';

export class MigrateReadsFromInfluxdbToMeterReadsTable1753179519598
  implements MigrationInterface
{
  name = 'MigrateReadsFromInfluxdbToMeterReadsTable1753179519598';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const devices = await queryRunner.query('SELECT * FROM public.device');
    for (const device of devices) {
      const reads = await mapReadsToMeterReadsTableFormat(
        device.externalId,
        device.createdAt,
      );

      if (reads.length > 0) {
        // Prepare arrays for batch insert
        const externalIds = reads.map(() => device.externalId);
        const types = reads.map(() => ReadType.Delta);
        const values = reads.map((read) => read.value);
        const units = reads.map((read) => read.unit);
        const startDates = reads.map((read) => read.startDate);
        const endDates = reads.map((read) => read.endDate);
        const createdAts = reads.map(() => new Date());
        const updatedAts = reads.map(() => new Date());

        // Single batch insert using UNNEST
        await queryRunner.query(
          `INSERT INTO public.meter_reads (
              "external_id", "type", "value", "unit", "start_date", "end_date", "created_at", "updated_at"
            ) VALUES (
              UNNEST($1::text[]),
              UNNEST($2::text[]),
              UNNEST($3::numeric[]),
              UNNEST($4::text[]),
              UNNEST($5::timestamp[]),
              UNNEST($6::timestamp[]),
              UNNEST($7::timestamp[]),
              UNNEST($8::timestamp[])
            )`,
          [
            externalIds,
            types,
            values,
            units,
            startDates,
            endDates,
            createdAts,
            updatedAts,
          ],
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM public.meter_reads');
  }
}
