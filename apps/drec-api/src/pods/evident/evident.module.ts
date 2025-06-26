import { forwardRef, Module } from '@nestjs/common';
import { DeviceModule } from '../device/device.module';
import { EvidentService } from './evident.service';
import { BullModule } from '@nestjs/bull';
import { EvidentDeviceRegistrationProcessor } from './evident-device-registration.processor';
import { Queues } from '../../utils/enums/queues.enum';
import { defaultBullJobOptions } from '../../config/bull.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { EvidentSettings } from './evident-settings.entity';
import { EvidentSettingsController } from './evident-settings.controller';
import { EvidentSettingsService } from './evident-settings.service';
import { TrrigerIssuanceRequestForOrganizationsService } from './trigger-Issuance-request-for-organizations';
import { CheckCertificateIssueDateLogForDeviceEntity } from '../device/check_certificate_issue_date_log_for_device.entity';
import { Device } from '../device';
import { ReadsModule } from '../reads/reads.module';
import { EvidentDeviceService } from './evident-device.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      EvidentSettings,
      Device,
      CheckCertificateIssueDateLogForDeviceEntity,
    ]),
    forwardRef(() => DeviceModule),
    BullModule.registerQueue({
      name: Queues.EvidentDeviceRegistration,
      defaultJobOptions: defaultBullJobOptions,
    }),
    ReadsModule,
  ],
  controllers: [EvidentSettingsController],
  providers: [
    EvidentSettingsService,
    EvidentService,
    TrrigerIssuanceRequestForOrganizationsService,
    EvidentDeviceRegistrationProcessor,
    EvidentDeviceService,
    EvidentSettingsService,
  ],
  exports: [EvidentService, EvidentDeviceService, EvidentSettingsService],
})
export class EvidentModule {}
