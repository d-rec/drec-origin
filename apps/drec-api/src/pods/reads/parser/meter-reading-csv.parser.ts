import { Unit } from '@energyweb/energy-api-influxdb';
import { CsvParser } from '../../../utils/csv-parser';
import { NewReadDTO } from '../../../models';
import { ReadType } from '../../../utils/enums';
export interface MeterReadingCSV {
  deviceId: string;
  unit: Unit;
  type: ReadType;
  timezone: string;
  reads: NewReadDTO[];
}

export const parseMeterReadingCsv = async (
  fileContent: Buffer,
): Promise<MeterReadingCSV[]> => {
  return new Promise((resolve, reject) => {
    const records: any[] = [];

    const parser = CsvParser.createParser({
      columns: [
        'id',
        'timezone',
        'type',
        'unit',
        'value',
        'startDate',
        'endDate',
      ],
      fromLine: 2,
    });

    parser.on('readable', () => {
      let record;
      while ((record = parser.read()) !== null) {
        records.push({
          deviceId: record.id,
          reads: [
            {
              starttimestamp: record.startDate,
              endtimestamp: record.endDate,
              value: record.value,
            },
          ],
          unit: record.unit,
          type: record.type,
          timezone: record.timezone,
        });
      }
    });

    parser.on('error', (err) => reject(err));
    parser.on('end', () => resolve(records));

    parser.write(fileContent);
    parser.end();
  });
};
