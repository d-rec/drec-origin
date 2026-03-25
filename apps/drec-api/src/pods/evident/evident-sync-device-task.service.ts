import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { NonConcurrentCron } from '../../lib/cron';
import { DeviceService } from '../device/device.service';

@Injectable()
export class EvidentSyncDeviceTaskService {
  private readonly logger = new Logger(EvidentSyncDeviceTaskService.name);

  constructor(private readonly deviceService: DeviceService) {}

  @NonConcurrentCron(CronExpression.EVERY_5_MINUTES)
  public async synchronizeDeviceStatuses(): Promise<void> {
    this.logger.verbose('Device status synchronization started');

    try {
      await this.deviceService.syncStatusesWithEvident();
    } catch (error) {
      this.logger.error('Device status synchronization failed', error.stack);
    }
    this.logger.verbose('Device status synchronization ended');
  }
}
