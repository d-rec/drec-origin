import { MigrationInterface, QueryRunner } from 'typeorm';

// This migration originally read from InfluxDB and inserted into meter_reads.
// InfluxDB has been removed; the migration has already run on all environments.
export class MigrateReadsFromInfluxdbToMeterReadsTable1753179519598
  implements MigrationInterface
{
  name = 'MigrateReadsFromInfluxdbToMeterReadsTable1753179519598';

  public async up(): Promise<void> {
    // no-op — data was migrated from InfluxDB to meter_reads in a prior release
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM public.meter_reads');
  }
}
