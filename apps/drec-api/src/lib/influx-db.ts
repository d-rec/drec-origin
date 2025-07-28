import {
  InfluxDB,
  Point,
  QueryApi,
  WriteApi,
} from '@influxdata/influxdb-client';
import { EnergyUnit } from '../types/units';

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

const getReadsByMeterId = async (meterId: string): Promise<Array<{ time: Date; read: number }>> => {
  try {
    const [db] = (process.env.INFLUXDB_BUCKET || 'energy/autogen').split('/');
    const influxUrl = process.env.INFLUXDB_URL || 'http://localhost:8086';
    
    const query = `SELECT * FROM "read" WHERE "meter" = '${meterId}' ORDER BY time ASC`;
    const queryUrl = `${influxUrl}/query?db=${encodeURIComponent(db)}&q=${encodeURIComponent(query)}`;
    
    const response = await fetch(queryUrl);
    const data = await response.json();
    
    const series = data?.results?.[0]?.series?.[0];
    if (!series) return [];
    
    const timeIndex = series.columns.indexOf('time');
    const readIndex = series.columns.indexOf('read');
    
    return series.values.map((row: any[]) => ({
      time: new Date(row[timeIndex]),
      read: parseFloat(row[readIndex]) || 0
    }));
  } catch (error) {
    console.error(`Error fetching reads for meter ${meterId}:`, error.message);
    throw error;
  }
};

const mapReadsToMeterReadsTableFormat = async (
  meterId: string, 
  onboardingDate: Date
): Promise<Array<{
  externalId: string;
  unit: EnergyUnit;
  value: number;
  startDate: Date;
  endDate: Date;
}>> => {
  try {
    const reads = await getReadsByMeterId(meterId);
    
    if (reads.length === 0) {
      console.log(`No reads found for meter ${meterId}`);
      return [];
    }
    
    reads.sort((a, b) => a.time.getTime() - b.time.getTime());
    
    return reads.map((read, index) => ({
      externalId: meterId,
      unit: EnergyUnit.Wh,
      value: read.read,
      startDate: index === 0 ? new Date(onboardingDate) : reads[index - 1].time,
      endDate: read.time
    }));
  } catch (error) {
    console.error(`Error mapping reads for meter ${meterId}:`, error.message);
    throw error;
  }
};

export {
  dbReader,
  dbWriter,
  writePoints,
  executeQuery,
  getReadsByMeterId,
  mapReadsToMeterReadsTableFormat,
};
