import { DeploymentPropertiesRepository } from '@energyweb/origin-247-certificate/dist/js/src/onchain-certificate/repositories/deploymentProperties/deploymentProperties.repository';
import {
    Inject,
    Injectable,
    OnApplicationBootstrap,
} from '@nestjs/common';
import { BlockchainProperties, BlockchainPropertiesService } from '@energyweb/issuer-api';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class OnApplicationBootstrapHookService implements OnApplicationBootstrap {
    public deploymentRepository: DeploymentPropertiesRepository=null;
    constructor(
        private moduleRef: ModuleRef,
        public blockchainPropertiesService: BlockchainPropertiesService
    ) { }

    async onApplicationBootstrap() {
        this.deploymentRepository = this.moduleRef.get(DeploymentPropertiesRepository as any, { strict: false }) as DeploymentPropertiesRepository;
        const isDeployed = await this.deploymentRepository.propertiesExist();
        if (!isDeployed) {
            let blockchainProperties: BlockchainProperties = await this.blockchainPropertiesService.get();
            await this.deploymentRepository.save({
                registry: blockchainProperties.registry,
                issuer: blockchainProperties.issuer,
            });

        }
    }
}