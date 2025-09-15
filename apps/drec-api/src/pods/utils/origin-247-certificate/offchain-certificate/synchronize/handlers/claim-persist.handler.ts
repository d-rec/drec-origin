import { OffChainCertificateService } from '../../offchain-certificate.service';
import { Inject, Injectable } from '@nestjs/common';
import { chunk } from 'lodash';
import { CertificateClaimedEvent, CertificateEventType } from '../../../../../../events/certificate.events';

@Injectable()
export class ClaimPersistHandler {
    constructor(
        @Inject(ONCHAIN_CERTIFICATE_SERVICE_TOKEN)
        private readonly certificateService: OnChainCertificateService,
        private readonly offchainCertificateService: OffChainCertificateService,
        @Inject(BATCH_CONFIGURATION_TOKEN)
        private batchConfigurationService: BatchConfigurationService
    ) {}

    public async handleBatch(
        events: CertificateClaimedEvent[],
        blockchainIdMap: Record<number, number>
    ) {
        const eventsBlocks = chunk(
            events,
            this.batchConfigurationService.getBatchSizes().claimBatchSize
        );
        const failedCertificateIds: number[] = [];

        for (const eventsBlock of eventsBlocks) {
            const result = await this.synchronizeBatchBlock(eventsBlock, blockchainIdMap);
            failedCertificateIds.push(...result.failedCertificateIds);
        }

        return { failedCertificateIds };
    }

    private async synchronizeBatchBlock(
        events: CertificateClaimedEvent[],
        blockchainIdMap: Record<number, number>
    ): Promise<{ failedCertificateIds: number[] }> {
        try {
            const { transactionHash } = await this.certificateService.batchClaimWithTxHash(
                events.map((event) => ({
                    ...event.payload,
                    certificateId: blockchainIdMap[event.internalCertificateId]
                }))
            );

            const promises = events.map(async (event) => {
                await this.offchainCertificateService.claimPersisted(event.internalCertificateId, {
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
                    type: CertificateEventType.ClaimPersisted,
                    persistedEventId: event.id
                });

                return event.internalCertificateId;
            });

            await Promise.all(promises);

            return { failedCertificateIds: events.map((e) => e.internalCertificateId) };
        }
    }
}
