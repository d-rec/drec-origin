import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceModule } from '../device/device.module';
import { DeviceGroupController } from './device-group.controller';
import { DeviceGroup } from './device-group.entity';
import { DeviceGroupService } from './device-group.service';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceGroup]), DeviceModule],
  providers: [DeviceGroupService],
  exports: [DeviceGroupService],
  controllers: [DeviceGroupController],
})
export class DeviceGroupModule {}
