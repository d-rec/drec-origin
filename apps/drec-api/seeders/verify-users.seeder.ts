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
      this.logger.log('Starting to update email verification status for all users...');
      
      const nullEmailVerifiedAtCount = await this.connection.query(
        `SELECT COUNT(*) FROM "user" WHERE "email_verified_at" IS NULL`
      );
      
      const unverifiedCount = parseInt(nullEmailVerifiedAtCount[0].count);
      this.logger.log(`Found ${unverifiedCount} users without email verification timestamp`);
      
      if (unverifiedCount > 0) {
        await this.connection.query(
          `UPDATE email_confirmation SET confirmed = true WHERE confirmed = false`
        );
        this.logger.log('Updated all email confirmations to confirmed status');
        
        const updateResult = await this.connection.query(`
          UPDATE "user" 
          SET "email_verified_at" = '0001-01-01T00:00:00Z'::timestamptz 
          WHERE "email_verified_at" IS NULL
        `);
        
        const nullEmailVerifiedAtCountAfter = await this.connection.query(
          `SELECT COUNT(*) FROM "user" WHERE "email_verified_at" IS NULL`
        );
        const remainingUnverified = parseInt(nullEmailVerifiedAtCountAfter[0].count);
        
        this.logger.log(`Successfully updated ${unverifiedCount - remainingUnverified} users with email verification timestamp`);
        
        if (remainingUnverified > 0) {
          this.logger.warn(`${remainingUnverified} users still have NULL email_verified_at values`);
        }
      } else {
        this.logger.log('All users already have email verification timestamps set');
      }
    } catch (error) {
      this.logger.error(`Failed to update email verification status: ${error.message}`);
      throw error;
    }
  }

  async drop(): Promise<void> {
    this.logger.log('Reverting email verification updates is not supported');
  }
}
