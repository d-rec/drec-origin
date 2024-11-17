import { CsvParser } from "../../../utils/csv-parser";

export interface MeterReadingCSV {
  deviceId: string;
  value: number;
  timestamp: string;
  unit: string;
}

export const parseMeterReadingCsv = async (
  fileContent: Buffer,
): Promise<MeterReadingCSV[]> => {
  return new Promise((resolve, reject) => {
    const records: any[] = [];
    
    const parser = CsvParser.createParser({
      columns: ['deviceId', 'value', 'timestamp']
    });

    parser.on('readable', () => {
      let record;
      while ((record = parser.read()) !== null) {
        if (isValidReading(record)) {
          records.push({
            deviceId: record.deviceId,
            value: Number(record.value),
            timestamp: record.timestamp,
          });
        }
      }
    });

    parser.on('error', (err) => reject(err));
    parser.on('end', () => resolve(records));

    parser.write(fileContent);
    parser.end();
  });
};

function isValidReading(record: any): record is MeterReadingCSV {
  return (
    record.deviceId &&
    !isNaN(Number(record.value)) &&
    isValidDate(record.timestamp)
  );
}

function isValidDate(date: string): boolean {
  const timestamp = Date.parse(date);
  return !isNaN(timestamp);
}
