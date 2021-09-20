import { Contracts, IBlockchainProperties } from '@energyweb/issuer';
import { BlockchainPropertiesDTO } from '@energyweb/origin-drec-api-client/dist/js/src';
import { Web3Provider } from '@ethersproject/providers';

export const getBlockchainConfiguration = (
    web3: Web3Provider,
    blockchainProperties: BlockchainPropertiesDTO
) => {
    const configuration: IBlockchainProperties = {
        web3,
        registry: Contracts.factories.RegistryExtendedFactory.connect(
            blockchainProperties?.registry,
            web3
        ),
        issuer: Contracts.factories.IssuerFactory.connect(blockchainProperties?.issuer, web3),
        activeUser: web3.getSigner()
    };
    return configuration;
};
