import { Repository } from 'typeorm';
import { SeederInterface } from '../core/seeder-interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { User } from '../../src/pods/user/user.entity';
import { Organization } from '../../src/pods/organization/organization.entity';

@Injectable()
export class UsersSeeder implements SeederInterface {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  async run(): Promise<void> {
    // No standalone users to seed — API user seeder creates its own user.
  }

  async drop(): Promise<any> {
    await this.userRepository.delete({});
  }
}
