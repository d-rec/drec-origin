import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { NonConcurrentCron } from '../../lib/cron';
import { BlockchainSynchronizeService } from '../utils/origin-247-certificate/offchain-certificate/synchronize/blockchain-synchronize.service';
@Injectable()
export class SynchronizeBlockchainTaskService {
  private logger = new Logger(SynchronizeBlockchainTaskService.name);

  constructor(
    private readonly synchronizationService: BlockchainSynchronizeService,
  ) {}

  @NonConcurrentCron(CronExpression.EVERY_MINUTE)
  public async synchronizeBlockchain(): Promise<void> {
    this.logger.log(`Synchronizing blockchain started`);
    await this.synchronizationService.synchronize();
    this.logger.log(`Synchronizing blockchain Ended`);
  }
}
