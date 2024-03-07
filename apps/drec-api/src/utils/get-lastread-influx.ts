//import { Countries } from '@energyweb/utils-general';
import { countryCodesList } from '../models/country-code';
import { ReadDTO } from '@energyweb/energy-api-influxdb';
import {
  InfluxDB,
  QueryApi,
  FluxTableMetaData,
} from '@influxdata/influxdb-client';

export const NewfindLatestRead = async (
  meterId: string,
  deviceregisterdate: Date,
): Promise<ReadDTO | void> => {
  //console.log("527")
  //console.log(deviceregisterdate)
  //const regisdate = DateTime.fromISO(deviceregisterdate.toISOString());

  //@ts-ignore
  //@ts-ignore
  const url = process.env.INFLUXDB_URL;
  //@ts-ignore
  const token = process.env.INFLUXDB_TOKEN;
  //@ts-ignore
  const org = process.env.INFLUXDB_ORG;

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
  await influx.getQueryApi(org).queryRows(fluxQuery, {
    next(row: string[], meta: FluxTableMetaData) {
      const obj = meta.toObject(row);
      // return obj.map((record: any) => ({
      //     timestamp: new Date(record._time),
      //     value: Number(record._value),
      // }));
      console.log(obj);
      result = {
        timestamp: new Date(obj._time),
        value: Number(obj._value),
      };
      //return obj
    },
    error(error: Error) {
      console.error(error);
    },
    complete() {
      console.log('Query complete!');
    },
  });
  return result;
};

export const execute = (query: any) => {
  const data = dbReader.collectRows();
  return data.map((record: any) => ({
    timestamp: new Date(record._time),
    value: Number(record._value),
  }));
};
export const dbReader: any = () => {
  // const url = 'http://localhost:8086';
  // const token = 'admin:admin'
  // const org = '';

  //@ts-ignore
  const url = process.env.INFLUXDB_URL;
  //@ts-ignore
  const token = process.env.INFLUXDB_TOKEN;
  //@ts-ignore
  const org = process.env.INFLUXDB_ORG;

  //@ts-ignore
  return new InfluxDB({ url, token }).getQueryApi(org);
};
