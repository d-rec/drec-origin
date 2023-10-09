import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { AdminController } from './admin.controller';

import { UserModule } from '../user/user.module';
import { OrganizationModule } from '../organization/organization.module';
import { DeviceModule } from '../device';
import {DeviceGroupModule} from '../device-group/device-group.module'

@Module({
  imports: [TypeOrmModule.forFeature([User]), UserModule, OrganizationModule,DeviceModule,DeviceGroupModule],
  controllers: [AdminController],
})
export class AdminModule {}
