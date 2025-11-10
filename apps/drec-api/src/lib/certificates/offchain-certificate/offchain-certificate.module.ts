import { Module, OnModuleInit } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificateSynchronizationAttemptEntity } from './repositories/certificate-event/certificate-synchronization-attempt.entity';
import { CertificateCommandEntity } from './repositories/certificate-command/certificate-command.entity';
import { CertificateReadModelEntity } from './repositories/certificate-read-modal/certificate-read-model.entity';
import { CertificateEventEntity } from './repositories/certificate-event/certificate-event.entity';
import {
  OnChainCertificateForUnitTestsModule,
  OnChainCertificateModule,
} from '../onchain-certificate/onchain-certificate.module';
import { validateConfiguration } from '../configuration';
import { BullModule } from '@nestjs/bull';
import { OffChainCertificateService } from './offchain-certificate.service';
import {
  CERTIFICATE_COMMAND_REPOSITORY,
  CERTIFICATE_EVENT_REPOSITORY,
  CERTIFICATE_READ_MODEL_REPOSITORY,
  SYNCHRONIZE_QUEUE_NAME,
} from '../repository.keys';
import { CertificateCommandInMemoryRepository } from './repositories/certificate-command/certificate-command-in-memory.repository';
import { CertificateCommandPostgresRepository } from './repositories/certificate-command/certificate-command-postgres.repository';
import { CertificateEventService } from './repositories/certificate-event/certificate-event.service';
import {
  ENTITY_MANAGER,
  InMemoryEntityManager,
} from '../utils/entity-manager';
import { EntityManager } from 'typeorm';
import { CertificateReadModelPostgresRepository } from './repositories/certificate-read-modal/certificate-read-model.repository';
import { BlockchainSynchronizeQueuedService } from './synchronize/blockchain-synchronize-queued.service';
import { BlockchainSynchronizeTask } from './synchronize/blockchain-synchronize.task';
import { BlockchainSynchronizeService } from './synchronize/blockchain-synchronize.service';
import { ClaimPersistHandler } from './synchronize/handlers/claim-persist.handler';
import { IssuePersistHandler } from './synchronize/handlers/issue-persist.handler';
import { TransferPersistHandler } from './synchronize/handlers/transfer-persist.handler';
import { BlockchainSynchronizeSyncService } from './synchronize/blockchain-synchronize-sync.service';
import {
  BATCH_CONFIGURATION_TOKEN,
  BatchConfigurationService,
  BatchConfigurationServiceForUnitTests,
} from './synchronize/strategies/batch/batch.configuration';
import { BatchSynchronizeStrategy } from './synchronize/strategies/batch/batch-synchronize.strategy';
import { SYNCHRONIZE_STRATEGY } from './synchronize/strategies/synchronize.strategy';
import { CertificateEventPostgresRepository } from './repositories/certificate-event/certificate-event-postgres.repository';
import { CertificateEventInMemoryRepository } from './repositories/certificate-event/certificate-event-in-memory.repository';
import { CertificateReadModelInMemoryRepository } from './repositories/certificate-read-modal/certificate-read-model-in-memory.repository';

@Module({
  providers: [
    {
      provide: CERTIFICATE_COMMAND_REPOSITORY,
      useClass: CertificateCommandPostgresRepository,
    },
    {
      provide: CERTIFICATE_EVENT_REPOSITORY,
      useClass: CertificateEventPostgresRepository,
    },
    {
      provide: CERTIFICATE_READ_MODEL_REPOSITORY,
      useClass: CertificateReadModelPostgresRepository,
    },
    {
      provide: SYNCHRONIZE_STRATEGY,
      useClass: BatchSynchronizeStrategy,
    },
    {
      provide: BATCH_CONFIGURATION_TOKEN,
      useClass: BatchConfigurationService,
    },
    {
      provide: ENTITY_MANAGER,
      useExisting: EntityManager,
    },
    OffChainCertificateService,
    {
      provide: BlockchainSynchronizeService,
      useClass: BlockchainSynchronizeQueuedService,
    },
    BlockchainSynchronizeTask,
    IssuePersistHandler,
    ClaimPersistHandler,
    TransferPersistHandler,
    CertificateEventService,
  ],
  exports: [OffChainCertificateService, BlockchainSynchronizeService],
  imports: [
    OnChainCertificateModule,
    CqrsModule,
    TypeOrmModule.forFeature([
      CertificateEventEntity,
      CertificateCommandEntity,
      CertificateReadModelEntity,
      CertificateSynchronizationAttemptEntity,
    ]),

    BullModule.registerQueue({
      name: SYNCHRONIZE_QUEUE_NAME,
    }),
  ],
})
export class OffChainCertificateModule implements OnModuleInit {
  async onModuleInit(): Promise<any> {
    await validateConfiguration();
  }
}

@Module({})
export class OffChainCertificateForUnitTestsModule {
  public static register(onChainModule = OnChainCertificateForUnitTestsModule) {
    return {
      module: OffChainCertificateForUnitTestsModule,
      providers: [
        {
          provide: CERTIFICATE_COMMAND_REPOSITORY,
          useClass: CertificateCommandInMemoryRepository,
        },
        {
          provide: CERTIFICATE_EVENT_REPOSITORY,
          useClass: CertificateEventInMemoryRepository,
        },
        {
          provide: CERTIFICATE_READ_MODEL_REPOSITORY,
          useClass: CertificateReadModelInMemoryRepository,
        },
        {
          provide: SYNCHRONIZE_STRATEGY,
          useClass: BatchSynchronizeStrategy,
        },
        {
          provide: BATCH_CONFIGURATION_TOKEN,
          useClass: BatchConfigurationServiceForUnitTests,
        },
        {
          provide: ENTITY_MANAGER,
          useValue: InMemoryEntityManager,
        },
        {
          provide: BlockchainSynchronizeService,
          useClass: BlockchainSynchronizeSyncService,
        },
        OffChainCertificateService,
        IssuePersistHandler,
        ClaimPersistHandler,
        TransferPersistHandler,
        CertificateEventService,
      ],
      exports: [OffChainCertificateService, BlockchainSynchronizeService],
      imports: [onChainModule, CqrsModule],
    };
  }
}
