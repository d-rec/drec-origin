import { Injectable } from '@nestjs/common';
import { getConfiguration } from '../../../config/configuration';

export interface BatchConfiguration {
    issueBatchSize: number;
    claimBatchSize: number;
    transferBatchSize: number;
}

export const BATCH_CONFIGURATION_TOKEN = Symbol.for('BATCH_CONFIGURATION_TOKEN');

@Injectable()
export class BatchConfigurationService {
    getBatchSizes(): BatchConfiguration {
        return {
            issueBatchSize: getConfiguration().ISSUE_BATCH_SIZE,
            claimBatchSize: getConfiguration().CLAIM_BATCH_SIZE,
            transferBatchSize: getConfiguration().TRANSFER_BATCH_SIZE
        };
    }
}

@Injectable()
export class BatchConfigurationServiceForUnitTests {
    getBatchSizes(): BatchConfiguration {
        return {
            issueBatchSize: 10,
            claimBatchSize: 20,
            transferBatchSize: 20
        };
    }
}
