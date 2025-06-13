import { forwardRef, Module } from '@nestjs/common'
import { DeviceModule } from '../device/device.module';
import { EvidentService } from './evident.service';
import { DeviceGroupModule } from '../device-group/device-group.module';
import { BullModule } from '@nestjs/bull';
import { EvidentDeviceRegistrationProcessor } from './evident-device-registration.processor';
import { Queues } from '../../utils/enums/queues.enum';
import { defaultBullJobOptions } from '../../config/bull.config';

@Module({
    imports: [
        forwardRef(() => DeviceModule),
        BullModule.registerQueue({
            name: Queues.EvidentDeviceRegistration,
            defaultJobOptions: defaultBullJobOptions,
        }),
    ],
    providers: [EvidentService, EvidentDeviceRegistrationProcessor],
    exports: [EvidentService],
})
export class EvidentModule {}       