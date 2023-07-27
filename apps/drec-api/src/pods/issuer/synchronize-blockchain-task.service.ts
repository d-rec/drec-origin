import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BlockchainSynchronizeService } from '@energyweb/origin-247-certificate';
​
@Injectable()
export class SynchronizeBlockchainTaskService {
    private logger = new Logger(SynchronizeBlockchainTaskService.name);
​
    constructor(private synchronizationService: BlockchainSynchronizeService) {}
​
    @Cron(CronExpression.EVERY_MINUTE)
    public async synchronizeblockchain() {
        this.logger.log(`Synchronizing blockchain started`);
​
        await this.synchronizationService.synchronize();
        this.logger.log(`Synchronizing blockchain Ended`);
    }
}
