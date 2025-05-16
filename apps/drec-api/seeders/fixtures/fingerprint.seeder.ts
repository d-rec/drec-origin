import { Injectable, Logger } from '@nestjs/common';
import { SeederInterface } from '../core/seeder-interface';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { generateDeviceFingerprint } from '../../src/lib/device';

@Injectable()
export class FingerprintSeeder implements SeederInterface {
  private readonly logger = new Logger(FingerprintSeeder.name);
  constructor(
    @InjectConnection()
    private readonly connection: Connection,
  ) {}
  async run(): Promise<void> {
    try {
      const devices = await this.connection.query(
        `SELECT * FROM "device" WHERE "fingerprint" IS NULL`,
      );
      const chunks = [];
      const chunkSize = 1500;

      for (let i = 0; i < devices.length; i += chunkSize) {
        chunks.push(devices.slice(i, i + chunkSize));
      }

      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(async (device) => {
            const fingerprint = generateDeviceFingerprint({
              latitude: device.latitude,
              longitude: device.longitude,
              commissioningDate: device.commissioningDate,
              capacity: device.capacity,
              fuelCode: device.fuelCode,
              deviceTypeCode: device.deviceTypeCode,
            });
            await this.connection.query(
              `UPDATE "device" SET "fingerprint" = '${fingerprint}' WHERE id = ${device.id}`,
            );
          }),
        );
      }
    } catch (error) {
      this.logger.error(`Update failed: ${error.message}`);
      throw error;
    }
  }

  async drop(): Promise<void> {
    this.logger.log(`Reverting fingerprint generation`);
  }
}
