import { Unit } from '@energyweb/utils-general';
import { CsvParser } from '../../../utils/csv-parser';
import { ReadType } from 'src/utils/enums';

export interface MeterReadingCSV {
  deviceId: string;
  value: number;
  startTimestamp: Date;
  endTimestamp: Date;
  unit: Unit;
  type: ReadType;
}

export const parseMeterReadingCsv = async (
  fileContent: Buffer,
): Promise<MeterReadingCSV[]> => {
  return new Promise((resolve, reject) => {
    const records: any[] = [];

    const parser = CsvParser.createParser({
      columns: ['deviceId', 'value', 'timestamp'],
    });

    parser.on('readable', () => {
      let record;
      while ((record = parser.read()) !== null) {
        records.push({
          deviceId: record.deviceId,
          value: Number(record.value),
          timestamp: record.endTimestamp,
        });
      }
    });

    parser.on('error', (err) => reject(err));
    parser.on('end', () => resolve(records));

    parser.write(fileContent);
    parser.end();
  });
};
