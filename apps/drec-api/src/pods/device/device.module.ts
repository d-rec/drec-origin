import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceGroupModule } from '../device-group/device-group.module';
import { DeviceController } from './device.controller';
import { Device } from './device.entity';
import {ACLModulePermissions} from '../permission/permission.entity'
import { DeviceService } from './device.service';
import {PermissionService} from '../permission/permission.service';
import {CheckCertificateIssueDateLogForDeviceEntity} from './check_certificate_issue_date_log_for_device.entity'
@Module({
  imports: [
    forwardRef(() => DeviceGroupModule),
    TypeOrmModule.forFeature([Device,ACLModulePermissions,CheckCertificateIssueDateLogForDeviceEntity]),
  ],
  providers: [DeviceService],
  exports: [DeviceService],
  controllers: [DeviceController],
})
export class DeviceModule {}
