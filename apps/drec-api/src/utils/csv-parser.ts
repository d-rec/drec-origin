import { parse } from 'csv-parse';

export const parseCsvContent = async (fileContent: Buffer): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const records: any[] = [];
    
    const parser = parse({
      delimiter: ',',
      columns: true,
      skip_empty_lines: true
    });

    parser.on('readable', function() {
      let record;
      while ((record = parser.read()) !== null) {
        records.push(record);
      }
    });

    parser.on('error', function(err) {
      reject(err);
    });

    parser.on('end', function() {
      resolve(records);
    });

    parser.write(fileContent);
    parser.end();
  });
};
