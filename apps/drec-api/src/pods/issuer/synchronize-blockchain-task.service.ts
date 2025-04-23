import { BlockchainSynchronizeService } from '@energyweb/origin-247-certificate';
import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { NonConcurrentCron } from '../../lib/cron';
@Injectable()
export class SynchronizeBlockchainTaskService {
  private logger = new Logger(SynchronizeBlockchainTaskService.name);
  constructor(private synchronizationService: BlockchainSynchronizeService) {}

  @NonConcurrentCron(CronExpression.EVERY_MINUTE)
  public async synchronizeBlockchain(): Promise<void> {
    this.logger.log(`Synchronizing blockchain started`);
    await this.synchronizationService.synchronize();
    this.logger.log(`Synchronizing blockchain Ended`);
  }
}
