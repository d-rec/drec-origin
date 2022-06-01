import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceController } from './device.controller';
import { Device } from './device.entity';
import {ACLModulePermissions} from '../permission/permission.entity'
import { DeviceService } from './device.service';
import {PermissionService} from '../permission/permission.service';

@Module({
  imports: [TypeOrmModule.forFeature([Device,ACLModulePermissions])],
  providers: [DeviceService],
  exports: [DeviceService],
  controllers: [DeviceController],
})
export class DeviceModule {}
