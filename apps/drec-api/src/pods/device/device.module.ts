import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceGroupModule } from '../device-group/device-group.module';
import { DeviceController } from './device.controller';
import { Device } from './device.entity';
import { ACLModulePermission } from '../permission/permission.entity';
import { DeviceService } from './device.service';
import { CheckCertificateIssueDateLogForDeviceEntity } from './check_certificate_issue_date_log_for_device.entity';
import { CountryCodeModule } from '../countrycode/countrycode.module';
import { UserModule } from '../user/user.module';
import { OrganizationModule } from '../organization/organization.module';
import { DeviceLateOngoingIssueCertificateEntity } from './device_lateongoing_certificate.entity';
import { HttpModule } from '@nestjs/axios';
import { DocumentUploadsModule } from '../document-uploads/document-uploads.module';
import { EvidentModule } from '../evident/evident.module';
import { Organization } from '../organization/organization.entity';
import { EvidentSettings } from '../evident/evident-settings.entity';
import { MailModule } from '../../mail/mail.module';
import { ReadsModule } from '../reads/reads.module';

@Module({
  imports: [
    forwardRef(() => DeviceGroupModule),
    forwardRef(() => EvidentModule),
    forwardRef(() => MailModule),
    forwardRef(() => ReadsModule),
    CountryCodeModule,
    HttpModule,
    TypeOrmModule.forFeature([
      Device,
      ACLModulePermission,
      CheckCertificateIssueDateLogForDeviceEntity,
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
