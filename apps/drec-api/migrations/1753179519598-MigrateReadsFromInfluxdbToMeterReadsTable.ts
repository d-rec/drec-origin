import {MigrationInterface, QueryRunner} from "typeorm";
import { mapInfluxMeterReadsToMeterReadsTableFormat } from '../src/lib/influx-db';

export class MigrateReadsFromInfluxdbToMeterReadsTable1753179519598 implements MigrationInterface {
    name = 'MigrateReadsFromInfluxdbToMeterReadsTable1753179519598'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const readsArray = await mapInfluxMeterReadsToMeterReadsTableFormat();
        if (readsArray.length > 0) {
          const getDevice = await queryRunner.query(
            'SELECT * FROM public.device WHERE "externalId" = $1',  
            [readsArray[0].externalId],
          );
          readsArray[0].startDate =
            getDevice && getDevice[0]
              ? getDevice[0].createdAt
              : Date.now().toString();
        }
        for (const read of readsArray) {
            const readsStartDate = read.startDate ? new Date(read.startDate) : null;
            const readsEndDate = read.endDate ? new Date(read.endDate) : null;
            
            await queryRunner.query(
              `INSERT INTO public.meter_reads (
                          "external_id","type","value","unit","start_date","end_date", "created_at", "updated_at" 
                      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                read.externalId,
                read.type,
                read.value,
                read.unit,
                readsStartDate,
                readsEndDate,
                new Date(),
                new Date(),
              ],
            );
          }
      }
    
      public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DELETE FROM public.meter_reads');
      }
}
