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
import { SynchronizeDeviceStatusTaskService } from './synchronize-device-status-task.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, EvidentSettings]),
    forwardRef(() => DeviceModule),
    BullModule.registerQueue({
      name: Queues.EvidentDeviceRegistration,
      defaultJobOptions: defaultBullJobOptions,
    }),
  ],
  controllers: [EvidentSettingsController],
  providers: [
    EvidentService,
    EvidentDeviceRegistrationProcessor,
    EvidentSettingsService,
    SynchronizeDeviceStatusTaskService,
  ],
  exports: [EvidentService],
})
export class EvidentModule {}
