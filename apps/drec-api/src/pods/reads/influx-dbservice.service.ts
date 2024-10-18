import { Injectable, Logger } from '@nestjs/common';
import { InfluxDB, Point } from '@influxdata/influxdb-client';

@Injectable()
export class InfluxDbService {
  private client: InfluxDB;
  private readonly logger = new Logger(InfluxDbService.name);

  constructor() {
    this.client = new InfluxDB({
      url: process.env.INFLUXDB_URL,
      token: process.env.INFLUXDB_TOKEN,
    });
  }

  async writeFailedRead(meter: string, read: string): Promise<void> {
    const writeApi = this.client.getWriteApi(
      process.env.INFLUXDB_ORG,
      process.env.INFLUXDB_BUCKET,
    );

    const point = new Point('failed_reads')
      .tag('meter', meter)
      .stringField('read', read);

    try {
      await writeApi.writePoint(point);
      await writeApi.close();
      this.logger.log(`Successfully logged failed read for meter: ${meter}`);
      return;
    } catch (error) {
      this.logger.error(
        `Error writing to InfluxDB: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to log meter read: ${error.message}`);
    }
  }
}
