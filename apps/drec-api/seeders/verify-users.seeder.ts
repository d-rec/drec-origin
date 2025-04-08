import { Injectable, Logger } from '@nestjs/common';
import { Connection } from 'typeorm';
import { InjectConnection } from '@nestjs/typeorm';
import { SeederInterface } from './seeder-interface';

@Injectable()
export class VerifyUsersSeeder implements SeederInterface {
  private readonly logger = new Logger(VerifyUsersSeeder.name);

  constructor(
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async run(): Promise<void> {
    try {
      this.logger.log('Starting email verification update...');
      
      const [{ count }] = await this.connection.query(
        `SELECT COUNT(*) as count FROM "user" WHERE "email_verified_at" IS NULL`
      );
      
      const unverifiedCount = parseInt(count);
      this.logger.log(`Found ${unverifiedCount} unverified users`);
      
      if (unverifiedCount === 0) {
        this.logger.log('All users already verified');
        return;
      }
      
      await this.connection.query(
        `UPDATE email_confirmation SET confirmed = true WHERE confirmed = false`
      );
      this.logger.log('Updated email confirmations to confirmed status');
      
      await this.connection.query(`
        UPDATE "user" 
        SET "email_verified_at" = '0001-01-01T00:00:00Z'::timestamptz 
        WHERE "email_verified_at" IS NULL
      `);
      
      this.logger.log(`Successfully verified ${unverifiedCount} users`);
    } catch (error) {
      this.logger.error(`Verification update failed: ${error.message}`);
      throw error;
    }
  }

  async drop(): Promise<void> {
    this.logger.log('Reverting email verification updates is not supported');
  }
}
