import { Repository } from "typeorm";
import { SeederInterface } from "./seeder-interface";
import { InjectRepository } from "@nestjs/typeorm";
import { Organization } from "../src/pods/organization/organization.entity";
import { OrganizationStatus } from "../src/utils/enums/organization-status.enum";
import { Injectable } from "@nestjs/common";

@Injectable()
export class OrganizationsSeeder implements SeederInterface{
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
                  organizationType: 'Buyer',
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
                  organizationType: 'Developer',
                  address: '456 Dev Ave',
                  zipCode: '20002',
                  city: 'San Francisco',
                  country: 'US',
                  api_user_id: 'e0ab91a4-03bc-4447-9d00-c51260fd6ff8',
                  status: OrganizationStatus.Active,
                  blockchainAccountAddress: null,
                  blockchainAccountSignedMessage: null,
                  documentIds: [],
              }
          ]);
    
        await this.organizationRepository.save(organizations);
        console.log('Seed organizations inserted successfully');
    }
    
     async drop(): Promise<any> {
         await this.organizationRepository.delete({});
         console.log('Seed organizations cleared successfully');
    }

}