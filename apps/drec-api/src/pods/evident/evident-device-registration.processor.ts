import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Device } from '../device/device.entity';
import { Queues } from '../../utils/enums/queues.enum';
import { EvidentDeviceService } from './evident-device.service';
import { DeviceGroup } from '../device-group/device-group.entity';
import { DeviceGroupService } from '../device-group/device-group.service';
@Processor(Queues.EvidentDeviceRegistration)
export class EvidentDeviceRegistrationProcessor {
  constructor(
    private readonly evidentDeviceService: EvidentDeviceService,
    private readonly deviceGroupService: DeviceGroupService,
  ) {}

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
    const result = await this.evidentDeviceService.registerDevice(
      device,
      files,
    );
    await this.deviceGroupService.updateEvidentStatus(
      group.id,
      group.deviceGroupUid,
      result.evidentDeviceId,
      result.status,
    );
  }
}
