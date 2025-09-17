import { BullModule } from '@nestjs/bull';
import { Module, OnModuleInit } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { getConfiguration, validateConfiguration } from '../configuration';
import { CertificateReadModelEntity } from '../offchain-certificate/repositories/certificate-read-modal/certificate-read-model.entity';
import { DeploymentPropertiesEntity } from './repositories/deploymentProperties/deployment-properties.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CERTIFICATE_READ_MODEL_REPOSITORY } from '../repository.keys';
import { TransactionPollService } from './certificate-operations/transactions-poll.service';
import { OnChainCertificateService } from './onchain-certificate.service';
import {
  BlockchainActionsProcessor,
  blockchainQueueName,
} from './blockchain-actions.processor';
import { ONCHAIN_CERTIFICATE_SERVICE_TOKEN } from './types';
import { DeploymentPropertiesRepository } from './repositories/deploymentProperties/deployment-properties.repository';
import { DeploymentPropertiesPostgresRepository } from './repositories/deploymentProperties/deployment-properties-postgres.repository';
import { CertificateReadModelPostgresRepository } from '../offchain-certificate/repositories/certificate-read-modal/certificate-read-model.repository';
import { CertificateForUnitTestsService } from './onchain-certificate-for-unit-tests.service';
import { CertificateOperationsService } from './certificate-operations/certificate-operations.service';
import { OnChainWatcher } from './listeners/onchain-certificates.listener';
import { TransferCertificateHandler } from './certificate-operations/transfer/transfer-certificate.handler';
import { IssueCertificateHandler } from './certificate-operations/issue/issue-certificate.handler';
import { BatchTransferCertificatesHandler } from './certificate-operations/transfer/batch-transfer-certificates.handler';
import { ClaimCertificateHandler } from './certificate-operations/claim/claim-certificate.handler';
import { BatchIssueCertificatesHandler } from './certificate-operations/issue/batch-issue-certificates.handler';
import { BatchClaimCertificatesHandler } from './certificate-operations/claim/batch-claim-certificates.handler';
import { BlockchainPropertiesService } from './blockchain-properties.service';
import { OnChainCertificateFacade } from './onchain-certificate-facade';
import { CertificateReadModelInMemoryRepository } from '../offchain-certificate/repositories/certificate-read-modal/certificate-read-model-in-memory.repository';
import { DeploymentPropertiesRepositoryImpl } from './repositories/deploymentProperties/deployment-properties.repository.impl';

const realCertificateProvider = {
  provide: ONCHAIN_CERTIFICATE_SERVICE_TOKEN,
  useClass: OnChainCertificateService,
};

@Module({
  providers: [
    realCertificateProvider,
    BlockchainActionsProcessor,
    TransactionPollService,
    BlockchainPropertiesService,
    OnChainCertificateFacade,
    BatchClaimCertificatesHandler,
    BatchIssueCertificatesHandler,
    BatchTransferCertificatesHandler,
    ClaimCertificateHandler,
    IssueCertificateHandler,
    TransferCertificateHandler,
    CertificateOperationsService,
    TransactionPollService,
    OnChainWatcher,
    {
      provide: DeploymentPropertiesRepository,
      useClass: DeploymentPropertiesPostgresRepository,
    },
    {
      provide: CERTIFICATE_READ_MODEL_REPOSITORY,
      useClass: CertificateReadModelPostgresRepository,
    },
  ],
  exports: [realCertificateProvider, OnChainCertificateFacade],
  imports: [
    CqrsModule,
    BullModule.registerQueueAsync({
      name: blockchainQueueName,
      useFactory: () => ({
        settings: {
          lockDuration: getConfiguration().CERTIFICATE_QUEUE_LOCK_DURATION,
        },
      }),
    }),
    TypeOrmModule.forFeature([
      DeploymentPropertiesEntity,
      CertificateReadModelEntity,
    ]),
  ],
})
export class OnChainCertificateModule implements OnModuleInit {
  async onModuleInit(): Promise<any> {
    await validateConfiguration();
  }
}

const inMemoryServiceProvider = {
  provide: ONCHAIN_CERTIFICATE_SERVICE_TOKEN,
  useClass: CertificateForUnitTestsService,
};

@Module({
  providers: [
    inMemoryServiceProvider,
    {
      provide: CERTIFICATE_READ_MODEL_REPOSITORY,
      useClass: CertificateReadModelInMemoryRepository,
    },
  ],
  exports: [inMemoryServiceProvider],
  imports: [CqrsModule],
})
export class OnChainCertificateForUnitTestsModule {}
