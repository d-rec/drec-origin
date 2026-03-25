import { Repository } from 'typeorm';
import { SeederInterface } from '../core/seeder-interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Organization } from '../../src/pods/organization/organization.entity';
import { OrganizationStatus } from '../../src/utils/enums/organization-status.enum';
import { Injectable } from '@nestjs/common';
import { OrganizationType } from '../../src/utils/enums';

@Injectable()
export class OrganizationsSeeder implements SeederInterface {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  async run(): Promise<void> {
    const buyerEmail = process.env.BUYER_EMAIL;
    const developerEmail = process.env.DEVELOPER_EMAIL;
    const organizations = this.organizationRepository.create([
      {
        name: 'John Doe',
        orgEmail: buyerEmail?.toLowerCase() || '',
        organizationType: OrganizationType.Buyer,
        address: '123 Buyer St',
        zipCode: '10001',
        city: 'New York',
        country: 'US',
        api_user_id: 'e0ab91a4-03bc-4447-9d00-c51260fd6ff8',
        status: OrganizationStatus.Active,
        blockchainAccountAddress: null,
        blockchainAccountSignedMessage: null,
        documentIds: [],
      },
      {
        name: 'Jane Smith',
        orgEmail: developerEmail?.toLowerCase() || '',
        organizationType: OrganizationType.Developer,
        address: '456 Dev Ave',
        zipCode: '20002',
        city: 'San Francisco',
        country: 'US',
        api_user_id: 'e0ab91a4-03bc-4447-9d00-c51260fd6ff8',
        status: OrganizationStatus.Active,
        blockchainAccountAddress: null,
        blockchainAccountSignedMessage: null,
        documentIds: [],
      },
    ]);

    await this.organizationRepository.save(organizations);
  }

  async drop(): Promise<any> {
    await this.organizationRepository.delete({});
  }
}
