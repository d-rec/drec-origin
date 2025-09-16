import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { providers } from 'ethers';
import { CertificateUtils, IBlockchainProperties } from '@energyweb/issuer';

import { BlockchainPropertiesService } from '../blockchain-properties.service';
import { getConfiguration } from '../config/configuration';
import { TransactionPollService } from '../certificate-operations/transactions-poll.service';

@Injectable()
export class OnChainWatcher implements OnModuleInit {
    private readonly logger = new Logger(OnChainWatcher.name);

    public provider: providers.FallbackProvider | providers.JsonRpcProvider;

    public registry: IBlockchainProperties['registry'];

    constructor(
        private readonly blockchainPropertiesService: BlockchainPropertiesService,
        private readonly transactionPollService: TransactionPollService
    ) {}

    public async onModuleInit(): Promise<void> {
        this.logger.debug('Setting up on-chain certificate watcher');
        const { web3, registry } = await this.blockchainPropertiesService.getWrapped();
        this.provider = web3;
        this.registry = registry;

        this.provider.pollingInterval =
            getConfiguration().BLOCKCHAIN_POLLING_INTERVAL || this.provider.pollingInterval;

        this.provider.on(
            this.registry.filters.IssuanceSingle(null, null, null),
            (event: providers.Log) => this.processEvent(BlockchainEventType.IssuanceSingle, event)
        );

        this.provider.on(
            this.registry.filters.IssuanceBatch(null, null, null),
            (event: providers.Log) => this.processEvent(BlockchainEventType.IssuanceBatch, event)
        );

        this.provider.on(
            this.registry.filters.TransferSingle(null, null, null, null, null),
            (event: providers.Log) => this.processEvent(BlockchainEventType.TransferSingle, event)
        );

        this.provider.on(
            this.registry.filters.TransferBatch(null, null, null, null, null),
            (event: providers.Log) => this.processEvent(BlockchainEventType.TransferBatch, event)
        );

        this.provider.on(
            this.registry.filters.TransferBatchMultiple(null, null, null, null, null),
            (event: providers.Log) =>
                this.processEvent(BlockchainEventType.TransferBatchMultiple, event)
        );

        this.provider.on(
            this.registry.filters.ClaimSingle(null, null, null, null, null, null),
            (event: providers.Log) => this.processEvent(BlockchainEventType.ClaimSingle, event)
        );

        this.provider.on(
            this.registry.filters.ClaimBatch(null, null, null, null, null, null),
            (event: providers.Log) => this.processEvent(BlockchainEventType.ClaimBatch, event)
        );

        this.provider.on(
            this.registry.filters.ClaimBatchMultiple(null, null, null, null, null, null),
            (event: providers.Log) =>
                this.processEvent(BlockchainEventType.ClaimBatchMultiple, event)
        );
    }

    async processEvent(eventType: BlockchainEventType, rawEvent: providers.Log): Promise<void> {
        this.logger.debug(`Processing event ${eventType}: ${JSON.stringify(rawEvent)}`);

        const event = await CertificateUtils.decodeEvent(eventType, rawEvent, this.registry);

        switch (eventType) {
            case BlockchainEventType.IssuanceSingle:
                this.logEvent(BlockchainEventType.IssuanceSingle, [event._id.toNumber()]);
                this.transactionPollService.saveNewCertificate(event.transactionHash, [
                    event._id.toNumber()
                ]);
                break;

            case BlockchainEventType.IssuanceBatch:
                const ids = event._ids.map((id: any) => id.toNumber());
                this.logEvent(BlockchainEventType.IssuanceBatch, ids);
                this.transactionPollService.saveNewCertificate(event.transactionHash, ids);
                break;

            case BlockchainEventType.TransferSingle:
                this.logEvent(BlockchainEventType.TransferSingle, [event.id.toNumber()]);
                break;

            case BlockchainEventType.TransferBatch:
            case BlockchainEventType.TransferBatchMultiple:
                event.ids.forEach((id: any) => {
                    this.logEvent(BlockchainEventType.TransferBatch, [id.toNumber()]);
                });
                break;

            case BlockchainEventType.ClaimSingle:
                this.logEvent(BlockchainEventType.ClaimSingle, [event._id.toNumber()]);
                break;

            case BlockchainEventType.ClaimBatch:
            case BlockchainEventType.ClaimBatchMultiple:
                event._ids.forEach((id: any) => {
                    this.logEvent(BlockchainEventType.ClaimBatch, [id.toNumber()]);
                });
                break;

            default:
                this.logger.log(
                    `No handlers found for event: ${eventType} on Certificate ${event._id.toNumber()}`
                );
        }

        await this.transactionPollService.saveTransactionAsProcessed(event.transactionHash);
    }

    private logEvent(type: BlockchainEventType, ids: number[]) {
        this.logger.log(`Detected a new event: ${type} on Certificate ${JSON.stringify(ids)}`);
    }

    async onApplicationShutdown(): Promise<void> {
        this.logger.debug('Shutting down on-chain certificate watcher');

        this.provider.off(this.registry.filters.IssuanceSingle(null, null, null));
        this.provider.off(this.registry.filters.IssuanceBatch(null, null, null));
        this.provider.off(this.registry.filters.TransferSingle(null, null, null, null, null));
        this.provider.off(this.registry.filters.TransferBatch(null, null, null, null, null));
        this.provider.off(this.registry.filters.ClaimSingle(null, null, null, null, null, null));
        this.provider.off(this.registry.filters.ClaimBatch(null, null, null, null, null, null));
    }
}

export enum BlockchainEventType {
    IssuanceSingle = 'IssuanceSingle',
    IssuanceBatch = 'IssuanceBatch',
    TransferSingle = 'TransferSingle',
    TransferBatch = 'TransferBatch',
    ClaimSingle = 'ClaimSingle',
    ClaimBatch = 'ClaimBatch',
    TransferBatchMultiple = 'TransferBatchMultiple',
    ClaimBatchMultiple = 'ClaimBatchMultiple'
}
