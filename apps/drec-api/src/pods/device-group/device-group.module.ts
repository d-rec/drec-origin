import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceModule } from '../device/device.module';
import { DeviceGroupController } from './device-group.controller';
import { DeviceGroup } from './device-group.entity';
import { DeviceGroupService } from './device-group.service';
import { OrganizationModule } from '../organization/organization.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeviceGroup]),
    DeviceModule,
    OrganizationModule,
  ],
  providers: [DeviceGroupService],
  exports: [DeviceGroupService],
  controllers: [DeviceGroupController],
})
export class DeviceGroupModule {}
