import { Repository } from 'typeorm';
import { SeederInterface } from '../core/seeder-interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { User } from '../../src/pods/user/user.entity';

@Injectable()
export class TermsAndConditionsSeeder implements SeederInterface {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async run(): Promise<void> {
    await this.userRepository
      .createQueryBuilder()
      .update()
      .set({ termsAcceptedAt: '0001-01-01 00:00:00+00' })
      .where('terms_accepted_at IS NULL')
      .execute();
  }

  async drop(): Promise<any> {
    await this.userRepository
      .createQueryBuilder()
      .update()
      .set({ termsAcceptedAt: null })
      .execute();
  }
}
