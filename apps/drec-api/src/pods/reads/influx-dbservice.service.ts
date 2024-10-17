
import { Injectable } from '@nestjs/common';
import { InfluxDB, Point } from '@influxdata/influxdb-client';

@Injectable()
export class InfluxDbService {
  private client: InfluxDB;

  constructor() {
    this.client = new InfluxDB({
      url: process.env.INFLUXDB_URL,
      token: process.env.INFLUXDB_TOKEN,
    });
  }

  async writeFailedRead(meter: string, read: string) {
    const writeApi = this.client.getWriteApi(
      process.env.INFLUXDB_ORG,
      process.env.INFLUXDB_BUCKET
    );

    const point = new Point('failed_reads')
      .tag('meter', meter)
      .stringField('read', read);
    try{
        await writeApi.writePoint(point);
        await writeApi.close();
        console.log("successful")
        console.log(meter)
        console.log(read)
    }
    catch (error) {
      console.error("Error writing to InfluxDB:", error);
    }
  }
}