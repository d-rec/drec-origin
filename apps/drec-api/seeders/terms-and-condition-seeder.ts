import { Repository } from 'typeorm';
import { SeederInterface } from './seeder-interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { User } from '../src/pods/user/user.entity';

@Injectable()
export class TermsAndConditionsSeeder implements SeederInterface {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async run(): Promise<void> {
    console.log('Starting to update terms_accept_at field...');
    const result = await this.userRepository
      .createQueryBuilder()
      .update()
      .set({ terms_accept_at: '0001-01-01 00:00:00+00' })
      .where('terms_accept_at IS NULL')
      .execute();
    console.log('Update result:', result);
  }

  async drop(): Promise<any> {
    await this.userRepository
      .createQueryBuilder()
      .update()
      .set({ terms_accept_at: null })
      .execute();
  }
}
