import { Repository } from "typeorm";
import { SeederInterface } from "./seeder-interface";
import { InjectRepository } from "@nestjs/typeorm";
import { Injectable } from "@nestjs/common";
import { User } from "../src/pods/user/user.entity";
import { Role, UserStatus } from "../src/utils/enums";
import { Organization } from "../src/pods/organization/organization.entity";


@Injectable()
export class UsersSeeder implements SeederInterface{
    constructor(
        @InjectRepository(Organization)
        private readonly organizationRepository: Repository<Organization>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
      ) {}
async run(): Promise<void> {
    const buyerEmail = process.env.BUYER_EMAIL?.toLowerCase() || '';
    const developerEmail = process.env.DEVELOPER_EMAIL?.toLowerCase() || '';
    const buyerPassword = process.env.BUYER_PASSWORD || 'defaultPassword';
    const developerPassword = process.env.DEVELOPER_PASSWORD || 'defaultPassword';

    const buyerOrg = await this.organizationRepository.findOne({
        where: { orgEmail: buyerEmail },
    });

    const developerOrg = await this.organizationRepository.findOne({
        where: { orgEmail: developerEmail },
    });

    if (!buyerOrg || !developerOrg) {
        console.error('Error: One or both organizations not found.');
        return;
    } 
    const users = this.userRepository.create([
        {
            firstName: 'John',
            lastName: 'Doe',
            email: buyerEmail,
            password: buyerPassword,
            notifications: false,
            status: UserStatus.Active,
            role: Role.Buyer,
            roleId: 4,
            organization: buyerOrg, 
            api_user_id: 'e0ab91a4-03bc-4447-9d00-c51260fd6ff8',
        },
        {
            firstName: 'Jane',
            lastName: 'Smith',
            email: developerEmail,
            password: developerPassword,
            notifications: false,
            status: UserStatus.Active,
            role: Role.OrganizationAdmin,
            roleId: 2,
            organization: developerOrg, 
            api_user_id: 'e0ab91a4-03bc-4447-9d00-c51260fd6ff8',
        }
    ]);

    await this.userRepository.save(users);
    console.log('Seed users inserted successfully');
}

async drop(): Promise<any> {
    await this.userRepository.delete({});
    console.log('Seed users cleared successfully');
}
}