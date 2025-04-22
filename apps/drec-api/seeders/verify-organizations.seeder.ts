import { Injectable, Logger } from '@nestjs/common';
import { Connection } from 'typeorm';
import { InjectConnection } from '@nestjs/typeorm';
import { SeederInterface } from './seeder-interface';

@Injectable()
export class VerifyOrganizationsSeeder implements SeederInterface {
  private readonly logger = new Logger(VerifyOrganizationsSeeder.name);

  constructor(
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async run(): Promise<void> {
    try {
      this.logger.log('Starting organization verification update...');

      await this.connection.query(`
        UPDATE organization 
        SET verified_at = '0001-01-01T00:00:00Z'::timestamptz 
        WHERE verified_at IS NULL
      `);

      this.logger.log(`Successfully verified organizations`);
    } catch (error) {
      this.logger.error(`Verification update failed: ${error.message}`);
      throw error;
    }
  }

  async drop(): Promise<void> {
    this.logger.log(
      'Reverting organization verification updates is not supported',
    );
  }
}
