import { Injectable, Logger } from '@nestjs/common';
import { NonConcurrentCron } from '../../lib/cron';
import { CronExpression } from '@nestjs/schedule';
import { DeviceGroupService } from './device-group.service';

@Injectable()
export class ReservationExpiryCron {
  private readonly logger = new Logger(ReservationExpiryCron.name);

  constructor(private readonly groupService: DeviceGroupService) {}

  @NonConcurrentCron(CronExpression.EVERY_DAY_AT_1AM)
  async handleExpiredReservations(): Promise<void> {
    this.logger.log('Sweeping expired reservations…');
    const released = await this.groupService.sweepExpiredReservations();
    if (released > 0) {
      this.logger.log(`Deactivated ${released} expired reservation(s) and released their devices`);
    } else {
      this.logger.debug('No expired reservations found');
    }
  }
}
