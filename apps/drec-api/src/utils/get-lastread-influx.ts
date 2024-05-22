//import { Countries } from '@energyweb/utils-general';
import { countryCodesList } from '../models/country-code';
import { ReadDTO } from '@energyweb/energy-api-influxdb';
import {
  InfluxDB,
  QueryApi,
  FluxTableMetaData,
} from '@influxdata/influxdb-client';
import { Logger } from '@nestjs/common';

export const NewfindLatestRead = async (
  meterId: string,
  deviceregisterdate: Date,
): Promise<ReadDTO | void> => {
  const logger = new Logger('NewfindLatestRead');

  const url = process.env.INFLUXDB_URL;
  const token = process.env.INFLUXDB_TOKEN;
  const org = process.env.INFLUXDB_ORG;

  logger.log('Connecting to InfluxDB...');

  const influx = new InfluxDB({
    url: url,
    token: token,
  });
  // const queryApi = influx.getQueryApi(org);
  let result: any;

  const fluxQuery = `from(bucket: "${process.env.INFLUXDB_BUCKET}")
    |> range(start: ${deviceregisterdate}, stop: now())
    |> filter(fn: (r) => r.meter == "${meterId}" and r._field == "read")
    |> last()`;

  logger.debug(`Executing Flux query: ${fluxQuery}`);

  await influx.getQueryApi(org).queryRows(fluxQuery, {
    next(row: string[], meta: FluxTableMetaData) {
      const obj = meta.toObject(row);
      // return obj.map((record: any) => ({
      //     timestamp: new Date(record._time),
      //     value: Number(record._value),
      // }));
      logger.debug(`Received row: ${obj}`);
      result = {
        timestamp: new Date(obj._time),
        value: Number(obj._value),
      };
      //return obj
    },
    error(error: Error) {
      logger.error(`Error occurred: ${error}`);
    },
    complete() {
      logger.log('Query complete!');
    },
  });
  logger.debug(`Returning result: ${result}`);
  return result;
};

export const execute = (query: any) => {
  const logger = new Logger('execute');
  logger.debug(`Executing query: ${query}`);
  const data = dbReader.collectRows();
  logger.debug(`Query result: ${data}`);
  return data.map((record: any) => ({
    timestamp: new Date(record._time),
    value: Number(record._value),
  }));
};
export const dbReader: any = () => {
  // const url = 'http://localhost:8086';
  // const token = 'admin:admin'
  // const org = '';

  const url = process.env.INFLUXDB_URL;
  const token = process.env.INFLUXDB_TOKEN;
  const org = process.env.INFLUXDB_ORG;

  return new InfluxDB({ url, token }).getQueryApi(org);
};
