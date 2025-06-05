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
import { EvidentService } from '../evident/evident.service';
import { BullModule } from '@nestjs/bull';
import { EvidentDeviceRegistrationProcessor } from '../evident/evident-device-registration.processor';
import { Queues } from '../../utils/enums/queues.enum';
import { defaultBullJobOptions } from '../../config/bull.config';

@Module({
  imports: [
    forwardRef(() => DeviceGroupModule),
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
    ]),
    UserModule,
    OrganizationModule,
    DocumentUploadsModule,
    BullModule.registerQueue({
      name: Queues.EvidentDeviceRegistration,
      defaultJobOptions: defaultBullJobOptions,
    })
  ],
  providers: [DeviceService, EvidentService, EvidentDeviceRegistrationProcessor],
  exports: [DeviceService, BullModule],
  controllers: [DeviceController],
})
export class DeviceModule {}
