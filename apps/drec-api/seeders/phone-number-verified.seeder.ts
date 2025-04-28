import { Repository } from 'typeorm';
import { SeederInterface } from './seeder-interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { User } from '../src/pods/user/user.entity';

@Injectable()
export class PhoneNumberVerifiedAtSeeder implements SeederInterface {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async run(): Promise<void> {
    // Set phone_number_verified_at to '0001-01-01T00:00:00Z' for all users who did not verify
    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ phone_number_verified_at: '0001-01-01T00:00:00Z' })
      .where('phone_number_verified_at IS NULL')
      .execute();
  }

  async drop(): Promise<void> {
    // Reverse the seed: set phone_number_verified_at back to NULL where it is '0001-01-01T00:00:00Z'
    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ phone_number_verified_at: null })
      .where('phone_number_verified_at = :date', {
        date: '0001-01-01T00:00:00Z',
      })
      .execute();
  }
}
