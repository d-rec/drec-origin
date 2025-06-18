import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { NonConcurrentCron } from '../../lib/cron';
import { DeviceService } from '../device';

@Injectable()
export class SynchronizeDeviceStatusTaskService {
  private readonly logger = new Logger(SynchronizeDeviceStatusTaskService.name);

  constructor(private readonly deviceService: DeviceService) {}

  @NonConcurrentCron(CronExpression.EVERY_10_MINUTES)
  public async synchronizeDeviceStatuses(): Promise<void> {
    this.logger.log('Device status synchronization started');

    try {
      await this.deviceService.syncDeviceStatusesWithEvident();
      console.log("after one minutes")
    } catch (error) {
      this.logger.error('Device status synchronization failed', error.stack);
    }

    this.logger.log('Device status synchronization ended');
  }
}