import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceGroupModule } from '../device-group/device-group.module';
import { DeviceController } from './device.controller';
import { Device } from './device.entity';
import { ACLModulePermission } from '../permission/permission.entity';
import { DeviceService } from './device.service';
import { CheckCertificateIssueDateLogForDeviceEntity } from './check_certificate_issue_date_log_for_device.entity';
import { CountryCodeModule } from '../countrycode/countrycode.module';
import { HistoryIntermediateMeterRead } from '../reads/history_intermideate_meterread.entity';
import { IRECDevicesInformationEntity } from './irec_devices_information.entity';
import { IRECErrorLogInformationEntity } from './irec_error_log_information.entity';
import { UserModule } from '../user/user.module';
import { OrganizationModule } from '../organization/organization.module';
import { DeviceLateOngoingIssueCertificateEntity } from './device_lateongoing_certificate.entity';
import { HttpModule } from '@nestjs/axios';
import { DocumentUploadsModule } from '../document-uploads/document-uploads.module';
import { EvidentModule } from '../evident/evident.module';
import { Organization } from '../organization/organization.entity';
import { EvidentSettings } from '../evident/evident-settings.entity';

@Module({
  imports: [
    forwardRef(() => DeviceGroupModule),
    forwardRef(() => EvidentModule),
    CountryCodeModule,
    HttpModule,
    TypeOrmModule.forFeature([
      Device,
      ACLModulePermission,
      CheckCertificateIssueDateLogForDeviceEntity,
      HistoryIntermediateMeterRead,
      IRECDevicesInformationEntity,
      IRECErrorLogInformationEntity,
      DeviceLateOngoingIssueCertificateEntity,
      Organization,
      EvidentSettings, // Ensure EvidentSettings is imported correctly
    ]),
    forwardRef(() => UserModule),
    forwardRef(() => OrganizationModule),
    DocumentUploadsModule,
  ],
  providers: [DeviceService],
  exports: [DeviceService],
  controllers: [DeviceController],
})
export class DeviceModule {}
