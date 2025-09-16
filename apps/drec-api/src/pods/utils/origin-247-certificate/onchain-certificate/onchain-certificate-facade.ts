import { IBlockchainProperties } from '@energyweb/issuer';
import { Injectable } from '@nestjs/common';
import { BlockchainProperties, BlockchainPropertiesService } from './blockchain-properties.service';
import { DeployParameters } from '../../../../types/utils/deploy';

@Injectable()
export class OnChainCertificateFacade {
    constructor(private blockchainPropertiesService: BlockchainPropertiesService) {}

    public async deploy(deployParameters?: DeployParameters): Promise<void> {
        await this.blockchainPropertiesService.deploy(deployParameters);
    }

    public async getBlockchainProperties(): Promise<BlockchainProperties> {
        return await this.blockchainPropertiesService.get();
    }

    public async getWrappedBlockchainProperties(): Promise<IBlockchainProperties> {
        return await this.blockchainPropertiesService.getWrapped();
    }
}
