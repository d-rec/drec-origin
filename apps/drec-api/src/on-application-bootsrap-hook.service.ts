import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import {
  BlockchainProperties,
  BlockchainPropertiesService,
} from '@energyweb/issuer-api';
import { ModuleRef } from '@nestjs/core';
import { DeploymentPropertiesRepository } from './lib/certificates/onchain-certificate/repositories/deploymentProperties/deployment-properties.repository';

@Injectable()
export class OnApplicationBootstrapHookService
  implements OnApplicationBootstrap
{
  public deploymentRepository: DeploymentPropertiesRepository = null;
  constructor(
    private moduleRef: ModuleRef,
    public blockchainPropertiesService: BlockchainPropertiesService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    this.deploymentRepository = this.moduleRef.get(
      DeploymentPropertiesRepository as any,
      { strict: false },
    ) as DeploymentPropertiesRepository;
    const isDeployed = await this.deploymentRepository.propertiesExist();
    if (!isDeployed) {
      const blockchainProperties: BlockchainProperties =
        await this.blockchainPropertiesService.get();
      await this.deploymentRepository.save({
        registry: blockchainProperties.registry,
        issuer: blockchainProperties.issuer,
      });
    }
  }
}
