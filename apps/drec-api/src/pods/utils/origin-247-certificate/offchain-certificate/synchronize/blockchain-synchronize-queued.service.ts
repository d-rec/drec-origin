import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { SYNCHRONIZE_QUEUE_NAME } from '../../repository.keys';
import { BlockchainSynchronizeService } from './blockchain-synchronize.service';

@Injectable()
export class BlockchainSynchronizeQueuedService implements BlockchainSynchronizeService {
    constructor(
        @InjectQueue(SYNCHRONIZE_QUEUE_NAME)
        private readonly synchronizationQueue: Queue
    ) {}

    public async synchronize() {
        await this.synchronizationQueue.add({});
    }
}
