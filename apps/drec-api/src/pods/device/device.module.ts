import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceGroupModule } from '../device-group/device-group.module';
import { DeviceController } from './device.controller';
import { Device } from './device.entity';
import { ACLModulePermissions } from '../permission/permission.entity';
import { DeviceService } from './device.service';
import { CheckCertificateIssueDateLogForDeviceEntity } from './check_certificate_issue_date_log_for_device.entity';
import { CountrycodeModule } from '../countrycode/countrycode.module';
import { HistoryIntermediate_MeterRead } from '../reads/history_intermideate_meterread.entity';
import { IrecDevicesInformationEntity } from './irec_devices_information.entity';
import { IrecErrorLogInformationEntity } from './irec_error_log_information.entity';
import { UserModule } from '../user/user.module';
import { OrganizationModule } from '../organization/organization.module';
import { DeviceLateongoingIssueCertificateEntity } from './device_lateongoing_certificate.entity';
import { HttpModule } from '@nestjs/axios';
@Module({
  imports: [
    forwardRef(() => DeviceGroupModule),
    CountrycodeModule,
    HttpModule,
    TypeOrmModule.forFeature([
      Device,
      ACLModulePermissions,
      CheckCertificateIssueDateLogForDeviceEntity,
      HistoryIntermediate_MeterRead,
      IrecDevicesInformationEntity,
      IrecErrorLogInformationEntity,
      DeviceLateongoingIssueCertificateEntity,
    ]),
    UserModule,
    OrganizationModule,
  ],
  providers: [DeviceService],
  exports: [DeviceService],
  controllers: [DeviceController],
})
export class DeviceModule {}
