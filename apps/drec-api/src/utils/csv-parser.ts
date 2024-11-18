import { Options, parse, Parser } from 'csv-parse';

export class CsvParser {
  static createParser(options: Options = {}): Parser {
    return parse({
      delimiter: ',',
      columns: true,
      skip_empty_lines: true,
      cast: true,
      trim: true,
      ...options,
    });
  }
}
