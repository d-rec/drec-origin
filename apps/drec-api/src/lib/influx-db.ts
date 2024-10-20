import {
  InfluxDB,
  Point,
  QueryApi,
  WriteApi,
} from '@influxdata/influxdb-client';

const dbConfig = {
  url: process.env.INFLUXDB_URL || 'http://localhost:8086',
  token: process.env.INFLUXDB_TOKEN || 'admin:admin',
};

const dbWriter = (): WriteApi => {
  return new InfluxDB(dbConfig).getWriteApi(
    process.env.INFLUXDB_ORG || '',
    process.env.INFLUXDB_BUCKET,
  );
};

const dbReader = (): QueryApi => {
  return new InfluxDB(dbConfig).getQueryApi(process.env.INFLUXDB_ORG || '');
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

export { dbReader, dbWriter, writePoints, executeQuery };
