import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Device } from '../device/device.entity';
import { EvidentDeviceService } from './evident-device.service';
import { Queues } from '../../utils/enums/queues.enum';
@Processor(Queues.EvidentDeviceRegistration)
export class EvidentDeviceRegistrationProcessor {
  constructor(private readonly evidentDeviceService: EvidentDeviceService) {}

  @Process({ concurrency: 1 })
  async handleRegisterDevice(
    job: Job<{ organizationId: number; device: Device; files: any }>,
  ): Promise<any> {
    const { device, files } = job.data;
    await this.evidentDeviceService.registerDevice(device, files);
  }
}
