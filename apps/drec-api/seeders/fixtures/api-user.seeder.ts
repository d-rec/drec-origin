import { Repository } from 'typeorm';
import { SeederInterface } from '../core/seeder-interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { User } from '../../src/pods/user/user.entity';
import { Organization } from '../../src/pods/organization/organization.entity';
import { ApiUserEntity } from '../../src/pods/user/api-user.entity';
import { Role, UserStatus, OrganizationType, UserPermissionStatus } from '../../src/utils/enums';
import { OrganizationStatus } from '../../src/utils/enums/organization-status.enum';
import bcrypt from 'bcryptjs';

@Injectable()
export class ApiUserSeeder implements SeederInterface {
  constructor(
    @InjectRepository(ApiUserEntity)
    private readonly apiUserRepository: Repository<ApiUserEntity>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async run(): Promise<void> {
    const email = process.env.APIUSER_EMAIL?.toLowerCase() || '';
    const password = process.env.APIUSER_PASSWORD || 'defaultPassword';

    if (!email) {
      console.error('APIUSER_EMAIL is not set — skipping ApiUser seed.');
      return;
    }

    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      console.log(`ApiUser ${email} already exists — skipping.`);
      return;
    }

    const apiUser = await this.apiUserRepository.save(
      this.apiUserRepository.create({
        permission_status: UserPermissionStatus.Active,
      }),
    );

    const organization = await this.organizationRepository.save(
      this.organizationRepository.create({
        name: 'Evident demo',
        orgEmail: email,
        organizationType: OrganizationType.ApiUser,
        address: '1 Evident St',
        zipCode: '00000',
        city: 'London',
        country: 'GB',
        api_user_id: apiUser.api_user_id,
        status: OrganizationStatus.Active,
        blockchainAccountAddress: null,
        blockchainAccountSignedMessage: null,
        documentIds: [],
      }),
    );

    const hashedPassword = bcrypt.hashSync(password, 8);

    await this.userRepository.save(
      this.userRepository.create({
        firstName: 'Evident',
        lastName: 'Demo',
        email,
        password: hashedPassword,
        notifications: false,
        status: UserStatus.Active,
        role: Role.ApiUser,
        roleId: 6,
        organization,
        api_user_id: apiUser.api_user_id,
      }),
    );

    console.log(`ApiUser ${email} seeded successfully.`);
  }

  async drop(): Promise<void> {
    const email = process.env.APIUSER_EMAIL?.toLowerCase() || '';
    if (email) {
      await this.userRepository.delete({ email });
    }
  }
}
