import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsSeeder } from './permissions.seeder';
import { ACLModulePermission } from '../src/pods/permission/permission.entity';
import { originAppTypeOrmModule } from '../src/drec.module';
import { Organization } from '../src/pods/organization/organization.entity';
import { User } from '../src/pods/user/user.entity';
import { Device } from '../src/pods/device/device.entity';
import { OrganizationsSeeder } from './organizations.seeder';
import { UsersSeeder } from './user.seeder';
import { DevicesSeeder } from './devices.seeder';

@Module({
  imports: [
    originAppTypeOrmModule(),
    TypeOrmModule.forFeature([ACLModulePermission, Organization, User, Device]),
  ],
  providers: [
    PermissionsSeeder,
    OrganizationsSeeder,
    UsersSeeder,
    DevicesSeeder,
  ],
})
export class SeederModule {}
