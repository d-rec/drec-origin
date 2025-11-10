import { IBlockchainProperties } from '@energyweb/issuer';
import { Injectable } from '@nestjs/common';
import {
  BlockchainProperties,
  BlockchainPropertiesService,
} from './blockchain-properties.service';

@Injectable()
export class OnChainCertificateFacade {
  constructor(
    private blockchainPropertiesService: BlockchainPropertiesService,
  ) {}

  public async deploy(): Promise<void> {
    await this.blockchainPropertiesService.deploy();
  }

  public async getBlockchainProperties(): Promise<BlockchainProperties> {
    return await this.blockchainPropertiesService.get();
  }

  public async getWrappedBlockchainProperties(): Promise<IBlockchainProperties> {
    return await this.blockchainPropertiesService.getWrapped();
  }
}
