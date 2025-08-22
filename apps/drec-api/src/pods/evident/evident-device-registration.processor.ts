import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Device } from '../device/device.entity';
import { Queues } from '../../utils/enums/queues.enum';
import { EvidentDeviceService } from './evident-device.service';
import { DeviceGroup } from '../device-group/device-group.entity';
@Processor(Queues.EvidentDeviceRegistration)
export class EvidentDeviceRegistrationProcessor {
  constructor(private readonly evidentDeviceService: EvidentDeviceService) {}

  @Process({ concurrency: 1 })
  async handleRegisterDevice(
    job: Job<{
      organizationId: number;
      device: Device;
      files: any;
      group: DeviceGroup;
    }>,
  ): Promise<any> {
    const { device, files, group } = job.data;
    await this.evidentDeviceService.registerDevice(device, files, group);
  }
}
