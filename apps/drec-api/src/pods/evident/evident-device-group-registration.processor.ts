import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Queues } from '../../utils/enums/queues.enum';
import { DeviceGroup } from '../device-group/device-group.entity';
import { EvidentDeviceService } from './evident-device.service';

@Processor(Queues.EvidentDeviceGroupRegistration)
export class EvidentDeviceGroupRegistrationProcessor {
  constructor(private readonly evidentDeviceService: EvidentDeviceService) {}

  @Process({ concurrency: 1 })
  async handleRegisterDevice(
    job: Job<{ organizationId: number; deviceGroup: DeviceGroup }>,
  ): Promise<any> {
    const { deviceGroup } = job.data;
    await this.evidentDeviceService.registerDeviceGroup(deviceGroup);
  }
}
