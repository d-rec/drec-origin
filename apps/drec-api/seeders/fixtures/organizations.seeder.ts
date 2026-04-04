import { Repository } from 'typeorm';
import { SeederInterface } from '../core/seeder-interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Organization } from '../../src/pods/organization/organization.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OrganizationsSeeder implements SeederInterface {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  async run(): Promise<void> {
    // No standalone organizations to seed — API user seeder creates its own org.
  }

  async drop(): Promise<any> {
    await this.organizationRepository.delete({});
  }
}
