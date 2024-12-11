import { Unit } from '@energyweb/utils-general';
import { CsvParser } from '../../../utils/csv-parser';
export interface MeterReadingCSV {
  deviceId: string;
  value: number;
  timestamp: Date;
  unit: Unit;
}

export const parseMeterReadingCsv = async (
  fileContent: Buffer,
): Promise<MeterReadingCSV[]> => {
  return new Promise((resolve, reject) => {
    const records: any[] = [];

    const parser = CsvParser.createParser({
      columns: ['id', 'value', 'timestamp', 'unit'],
    });

    parser.on('readable', () => {
      let record;
      while ((record = parser.read()) !== null) {
        records.push({
          deviceId: record.id,
          value: Number(record.value),
          timestamp: record.timestamp,
          unit: record.unit,
        });
      }
    });

    parser.on('error', (err) => reject(err));
    parser.on('end', () => resolve(records));

    parser.write(fileContent);
    parser.end();
  });
};
