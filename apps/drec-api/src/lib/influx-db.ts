import {
  InfluxDB,
  Point,
  QueryApi,
  WriteApi,
} from '@influxdata/influxdb-client';
import { Unit } from '../types/reads';

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

const getReadsByMeterId = async (meterId: string, onboardingDate: Date): Promise<Array<{ time: Date; value: number }>> => {
  try {
    const filterDate = new Date(onboardingDate);
    filterDate.setDate(filterDate.getDate() - 1);

    const query =  `
      from(bucket: "${process.env.INFLUXDB_BUCKET}")
      |> range(start: ${filterDate.toISOString()}, stop: now())
      |> filter(fn: (r) => r.meter == "${meterId}" and r._field == "read")
      |> sort(columns: ["_time"], desc: false)
      `;

    const data = await executeQuery(query);
    
    if (!data || data.length === 0) {
      return [];
    }
  
    const reads = data.map((row)=> ({
      time: new Date(row._time),
      value: parseFloat(row._value) || 0
    }));
    
    return reads.filter((read) => read.value > 0).sort((a, b) => a.time.getTime() - b.time.getTime());
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
  unit: Unit;
  value: number;
  startDate: Date;
  endDate: Date;
}>> => {
  try {
    const reads = await getReadsByMeterId(meterId, onboardingDate);
    
    if (reads.length === 0) {
      console.log(`No reads found for meter ${meterId}`);
      return [];
    }
    
    return reads.map((read, index) => ({
      externalId: meterId,
      unit: Unit.Wh,
      value: read.value,
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
  dbWriter, executeQuery,
  getReadsByMeterId,
  mapReadsToMeterReadsTableFormat, writePoints
};

