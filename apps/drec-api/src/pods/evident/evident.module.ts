import { BullModule } from '@nestjs/bull';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { defaultBullJobOptions } from '../../config/bull.config';
import { Queues } from '../../utils/enums/queues.enum';
import { DeviceModule } from '../device/device.module';
import { OrganizationModule } from '../organization/organization.module';
import { ReadsModule } from '../reads/reads.module';
import { EvidentDeviceRegistrationProcessor } from './evident-device-registration.processor';
import { EvidentDeviceService } from './evident-device.service';
import { EvidentIssuanceService } from './evident-issuance.service';
import { EvidentSettingsController } from './evident-settings.controller';
import { EvidentSettings } from './evident-settings.entity';
import { EvidentSettingsService } from './evident-settings.service';
import { EvidentService } from './evident.service';
import { Device } from '../device/device.entity';
import { Organization } from '../organization/organization.entity';
import { EvidentSyncDeviceTaskService } from './evident-sync-device-task.service';
import { MailModule } from '../../mail/mail.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EvidentSettings, Device, Organization]),
    forwardRef(() => DeviceModule),
    forwardRef(() => OrganizationModule),
    forwardRef(() => ReadsModule),
    forwardRef(() => MailModule),
    forwardRef(() => UserModule),
    BullModule.registerQueue({
      name: Queues.EvidentDeviceRegistration,
      defaultJobOptions: defaultBullJobOptions,
    }),
  ],
  controllers: [EvidentSettingsController],
  providers: [
    EvidentSettingsService,
    EvidentService,
    EvidentIssuanceService,
    EvidentDeviceRegistrationProcessor,
    EvidentSettingsService,
    EvidentDeviceService,
    EvidentSyncDeviceTaskService,
  ],
  exports: [
    EvidentService,
    EvidentDeviceService,
    EvidentSettingsService,
    EvidentSyncDeviceTaskService,
  ],
})
export class EvidentModule {}
