import {
  InfluxDB,
  Point,
  QueryApi,
  WriteApi,
} from '@influxdata/influxdb-client';
import { InfluxDB as InfluxV1 } from 'influx';

export const influxDBConfig = {
  url: process.env.INFLUXDB_URL || 'http://localhost:8086',
  token: process.env.INFLUXDB_TOKEN || 'admin:admin',
};

const dbWriter = (): WriteApi => {
  return new InfluxDB(influxDBConfig).getWriteApi(
    process.env.INFLUXDB_ORG || '',
    process.env.INFLUXDB_BUCKET,
  );
};

const dbReader = (): QueryApi => {
  return new InfluxDB(influxDBConfig).getQueryApi(
    process.env.INFLUXDB_ORG || '',
  );
};

const writePoints = async (points: Point[]): Promise<void> => {
  const writer = dbWriter();
  writer.writePoints(points);
  await writer.close();
};

const executeQuery = async (query: string): Promise<any[]> => {
  const reader = dbReader();
  const results = await reader.collectRows(query);
  return results;
};

const influx = new InfluxV1({
  host: process.env.INFLUXDB_HOST || 'localhost',
  port: 8086,
  database: process.env.INFLUXDB_DB || 'energy',
  username: process.env.INFLUXDB_ADMIN_USER || 'admin',
  password: process.env.INFLUXDB_ADMIN_PASSWORD || 'admin',
});

// Fetch all meter reads from InfluxDB v1.x
const fetchAllMeterReads = async (): Promise<any[]> => {
  const results = await influx.query('SELECT * FROM "read"');
  return results;
};

export { dbReader, dbWriter, writePoints, executeQuery, fetchAllMeterReads };
