import { OffChainCertificateService } from '../../offchain-certificate.service';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { chunk } from 'lodash';
import { CertificateEventType, CertificateIssuedEvent } from '../../../../../../events/certificate.events';
import { ONCHAIN_CERTIFICATE_SERVICE_TOKEN } from '../../../onchain-certificate/types';
import { BATCH_CONFIGURATION_TOKEN, BatchConfigurationService } from '../strategies/batch/batch.configuration';
import { OnChainCertificateService } from '../../../onchain-certificate/onchain-certificate.service';

@Injectable()
export class IssuePersistHandler {
    private logger = new Logger(IssuePersistHandler.name);

    constructor(
        @Inject(ONCHAIN_CERTIFICATE_SERVICE_TOKEN)
        private readonly certificateService: OnChainCertificateService<unknown>,
        private readonly offchainCertificateService: OffChainCertificateService,
        @Inject(BATCH_CONFIGURATION_TOKEN)
        private batchConfigurationService: BatchConfigurationService
    ) {}

    private async synchronizeBatchBlock(
        events: CertificateIssuedEvent[]
    ): Promise<{ failedCertificateIds: number[] }> {
        try {
            this.logger.debug(`Sending ${events.length} issuance events to issue`);

            const {
                certificateIds,
                transactionHash
            } = await this.certificateService.batchIssueWithTxHash(
                events
                    .map((issuedEvent) => issuedEvent.payload)
                    .map((payload) => ({
                        ...payload,
                        fromTime: new Date(payload.fromTime * 1000),
                        toTime: new Date(payload.toTime * 1000)
                    }))
            );

            const promises = events.map(async (event, index) => {
                await this.offchainCertificateService.issuePersisted(event.internalCertificateId, {
                    blockchainCertificateId: certificateIds[index],
                    persistedEventId: event.id,
                    transactionHash
                });
            });

            await Promise.all(promises);

            return { failedCertificateIds: [] };
        } catch (e) {
            const promises = events.map(async (event) => {
                await this.offchainCertificateService.persistError(event.internalCertificateId, {
                    errorMessage: `${e.message}`,
                    internalCertificateId: event.internalCertificateId,
                    type: CertificateEventType.IssuancePersisted,
                    persistedEventId: event.id
                });
            });

            await Promise.all(promises);

            return { failedCertificateIds: events.map((e) => e.internalCertificateId) };
        }
    }

    async handleBatch(events: CertificateIssuedEvent[]) {
        const eventsBlocks = chunk(
            events,
            this.batchConfigurationService.getBatchSizes().issueBatchSize
        );
        const failedCertificateIds: number[] = [];

        for (const eventsBlock of eventsBlocks) {
            const nonFailedEvents = eventsBlock.filter(
                (event) => !failedCertificateIds.includes(event.internalCertificateId)
            );

            const result = await this.synchronizeBatchBlock(nonFailedEvents);
            failedCertificateIds.push(...result.failedCertificateIds);
        }

        return { failedCertificateIds };
    }
}
