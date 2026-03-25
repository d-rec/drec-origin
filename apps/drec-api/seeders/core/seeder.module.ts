import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsSeeder } from '../fixtures/permissions.seeder';
import { ACLModulePermission } from '../../src/pods/permission/permission.entity';
import { originAppTypeOrmModule } from '../../src/drec.module';
import { Organization } from '../../src/pods/organization/organization.entity';
import { User } from '../../src/pods/user/user.entity';
import { Device } from '../../src/pods/device/device.entity';
import { OrganizationsSeeder } from '../fixtures/organizations.seeder';
import { UsersSeeder } from '../fixtures/user.seeder';
import { DevicesSeeder } from '../fixtures/devices.seeder';
import { VerifyOrganizationsSeeder } from '../fixtures/verify-organizations.seeder';
import { VerifyPhoneNumbersSeeder } from '../fixtures/verify-phone-number.seeder';
import { TermsAndConditionsSeeder } from '../fixtures/terms-and-condition-seeder';
import { VerifyEmailsSeeder } from '../fixtures/verify-emails.seeder';
import { FingerprintSeeder } from '../fixtures/fingerprint.seeder';
import { ApiUserSeeder } from '../fixtures/api-user.seeder';
import { ApiUserEntity } from '../../src/pods/user/api-user.entity';

@Module({
  imports: [
    originAppTypeOrmModule(),
    TypeOrmModule.forFeature([ACLModulePermission, Organization, User, Device, ApiUserEntity]),
  ],
  providers: [
    PermissionsSeeder,
    OrganizationsSeeder,
    UsersSeeder,
    DevicesSeeder,
    VerifyOrganizationsSeeder,
    VerifyPhoneNumbersSeeder,
    TermsAndConditionsSeeder,
    VerifyEmailsSeeder,
    FingerprintSeeder,
    ApiUserSeeder,
  ],
})
export class SeederModule {}
