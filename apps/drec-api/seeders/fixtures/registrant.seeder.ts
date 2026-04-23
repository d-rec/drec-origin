import { Repository } from 'typeorm';
import { SeederInterface } from '../core/seeder-interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { User } from '../../src/pods/user/user.entity';
import { Organization } from '../../src/pods/organization/organization.entity';
import { RegistrantEntity } from '../../src/pods/user/registrant.entity';
import {
  Role,
  UserStatus,
  OrganizationType,
  UserPermissionStatus,
} from '../../src/utils/enums';
import { OrganizationStatus } from '../../src/utils/enums/organization-status.enum';
import bcrypt from 'bcryptjs';

@Injectable()
export class RegistrantSeeder implements SeederInterface {
  constructor(
    @InjectRepository(RegistrantEntity)
    private readonly registrantRepository: Repository<RegistrantEntity>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async run(): Promise<void> {
    const email = process.env.REGISTRANT_EMAIL?.toLowerCase() || '';
    const password = process.env.REGISTRANT_PASSWORD;

    if (!email || !password) {
      console.error(
        'REGISTRANT_EMAIL and REGISTRANT_PASSWORD must be set — skipping Registrant seed.',
      );
      return;
    }

    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      console.log(`Registrant ${email} already exists — skipping.`);
      return;
    }

    const registrant = await this.registrantRepository.save(
      this.registrantRepository.create({
        permission_status: UserPermissionStatus.Active,
      }),
    );

    const organization = await this.organizationRepository.save(
      this.organizationRepository.create({
        name: 'Evident demo',
        orgEmail: email,
        organizationType: OrganizationType.Registrant,
        address: '1 Evident St',
        zipCode: '00000',
        city: 'London',
        country: 'GB',
        api_user_id: registrant.api_user_id,
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
        role: Role.Registrant,
        roleId: 6,
        organization,
        api_user_id: registrant.api_user_id,
      }),
    );

    console.log(`Registrant ${email} seeded successfully.`);
  }

  async drop(): Promise<void> {
    const email = process.env.REGISTRANT_EMAIL?.toLowerCase() || '';
    if (email) {
      await this.userRepository.delete({ email });
    }
  }
}
