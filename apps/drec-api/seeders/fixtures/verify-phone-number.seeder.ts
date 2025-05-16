import { Repository } from 'typeorm';
import { SeederInterface } from '../core/seeder-interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { User } from '../../src/pods/user/user.entity';

@Injectable()
export class VerifyPhoneNumbersSeeder implements SeederInterface {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async run(): Promise<void> {
    // Set phoneNumberVerifiedAt to '0001-01-01T00:00:00Z' for all users who did not verify
    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ phoneNumberVerifiedAt: '0001-01-01T00:00:00Z' })
      .where('phoneNumberVerifiedAt IS NULL')
      .execute();
  }

  async drop(): Promise<void> {
    // Reverse the seed: set phoneNumberVerifiedAt back to NULL where it is '0001-01-01T00:00:00Z'
    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ phoneNumberVerifiedAt: null })
      .where('phoneNumberVerifiedAt = :date', {
        date: '0001-01-01T00:00:00Z',
      })
      .execute();
  }
}
