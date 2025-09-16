import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { CertificateOperationsService } from './certificate-operations/certificate-operations.service';
import { BlockchainAction } from './types';
import { getConfiguration } from '../configuration';

export const blockchainQueueName = 'blockchain-actions';

@Processor(blockchainQueueName)
export class BlockchainActionsProcessor {
    private readonly logger = new Logger(BlockchainActionsProcessor.name);

    constructor(private readonly certificateOperationsFacade: CertificateOperationsService) {}

    @Process({ concurrency: 1 })
    async handle(payload: Job<BlockchainAction>): Promise<unknown> {
        try {
            const result = await this.certificateOperationsFacade.process(payload);

            /**
             * Sometimes we get conflicting nonce/gas price problem.
             * Therefore we need to give some time to process everything.
             */
            await new Promise((resolve) =>
                setTimeout(resolve, getConfiguration().CERTIFICATE_QUEUE_DELAY)
            );

            return result;
        } catch (e) {
            this.logger.error(
                `Error on job ${JSON.stringify(payload.data)}: ${e.message}`,
                e.stack
            );

            throw e;
        }
    }
}
