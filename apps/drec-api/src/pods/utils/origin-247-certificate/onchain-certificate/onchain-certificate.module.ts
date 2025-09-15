import { BullModule } from "@nestjs/bull";
import { Module, OnModuleInit } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { getConfiguration, validateConfiguration } from "../configuration";
import { CertificateReadModelEntity } from "../offchain-certificate/repositories/certificate-read-modal/certificate-read-model.entity";
import { DeploymentPropertiesEntity } from "../deployment-properties.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CERTIFICATE_READ_MODEL_REPOSITORY } from "../repository.keys";

const realCertificateProvider = {
    provide: ONCHAIN_CERTIFICATE_SERVICE_TOKEN,
    useClass: OnChainCertificateService
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
            useClass: DeploymentPropertiesPostgresRepository
        },
        {
            provide: CERTIFICATE_READ_MODEL_REPOSITORY,
            useClass: CertificateReadModelPostgresRepository
        }
    ],
    exports: [realCertificateProvider, OnChainCertificateFacade],
    imports: [
        CqrsModule,
        BullModule.registerQueueAsync({
            name: blockchainQueueName,
            useFactory: () => ({
                settings: {
                    lockDuration: getConfiguration().CERTIFICATE_QUEUE_LOCK_DURATION
                }
            })
        }),
        TypeOrmModule.forFeature([DeploymentPropertiesEntity, CertificateReadModelEntity])
    ]
})
export class OnChainCertificateModule implements OnModuleInit {
    async onModuleInit(): Promise<any> {
        await validateConfiguration();
    }
}

const inMemoryServiceProvider = {
    provide: ONCHAIN_CERTIFICATE_SERVICE_TOKEN,
    useClass: CertificateForUnitTestsService
};

@Module({
    providers: [
        inMemoryServiceProvider,
        {
            provide: CERTIFICATE_READ_MODEL_REPOSITORY,
            useClass: CertificateReadModelInMemoryRepository
        }
    ],
    exports: [inMemoryServiceProvider],
    imports: [CqrsModule]
})
export class OnChainCertificateForUnitTestsModule {}
