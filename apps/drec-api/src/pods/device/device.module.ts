import { Module, forwardRef, HttpModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceGroupModule } from '../device-group/device-group.module';
import { DeviceController } from './device.controller';
import { Device } from './device.entity';
import {ACLModulePermissions} from '../permission/permission.entity'
import { DeviceService } from './device.service';
import {PermissionService} from '../permission/permission.service';
import {CheckCertificateIssueDateLogForDeviceEntity} from './check_certificate_issue_date_log_for_device.entity'
import {CountrycodeModule} from '../countrycode/countrycode.module'
import { HistoryIntermediate_MeterRead } from '../reads/history_intermideate_meterread.entity';
import { APP_INTERCEPTOR } from '@nestjs/core';
import {IrecDevicesInformationEntity} from './irec_devices_information.entity';
import {IrecErrorLogInformationEntity} from './irec_error_log_information.entity'
@Module({
  imports: [
    forwardRef(() => DeviceGroupModule),
    CountrycodeModule,
    HttpModule,
    TypeOrmModule.forFeature([Device,ACLModulePermissions,
      CheckCertificateIssueDateLogForDeviceEntity,
      HistoryIntermediate_MeterRead,
      IrecDevicesInformationEntity,
      IrecErrorLogInformationEntity
    ]),
  ],
  providers: [DeviceService],
  exports: [DeviceService],
  controllers: [DeviceController],
  
})
export class DeviceModule {}
