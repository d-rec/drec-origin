import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { SeederInterface } from '../core/seeder-interface';

@Injectable()
export class VerifyEmailsSeeder implements SeederInterface {
  private readonly logger = new Logger(VerifyEmailsSeeder.name);

  constructor(
    @InjectDataSource()
    private readonly connection: DataSource,
  ) {}

  async run(): Promise<void> {
    try {
      this.logger.log('Starting email verification update...');

      const [{ count }] = await this.connection.query(
        `SELECT COUNT(*) as count FROM "user" WHERE "email_verified_at" IS NULL`,
      );

      const unverifiedCount = parseInt(count);
      this.logger.log(`Found ${unverifiedCount} unverified emails`);

      if (unverifiedCount === 0) {
        this.logger.log('All emails already verified');
        return;
      }

      await this.connection.query(`
        UPDATE "user" 
        SET "email_verified_at" = '0001-01-01T00:00:00Z'::timestamptz 
        WHERE "email_verified_at" IS NULL
      `);

      this.logger.log(`Successfully verified ${unverifiedCount} emails`);
    } catch (error) {
      this.logger.error(`Verification update failed: ${error.message}`);
      throw error;
    }
  }

  async drop(): Promise<void> {
    this.logger.log('Reverting email verification updates is not supported');
  }
}
