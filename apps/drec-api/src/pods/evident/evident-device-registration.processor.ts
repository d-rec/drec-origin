import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Device } from '../device/device.entity';
import { EvidentService } from './evident.service';
import { Queues } from '../../utils/enums/queues.enum';

@Processor(Queues.EvidentDeviceRegistration)
export class EvidentDeviceRegistrationProcessor {
  constructor(private readonly evidentService: EvidentService) {}

  @Process({ concurrency: 1 })
  async handleRegisterDevice(
    job: Job<{ device: Device; files: any }>,
  ): Promise<any> {
    const { device, files } = job.data;
    await this.evidentService.registerDevice(device, files);
  }
}
