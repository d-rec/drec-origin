import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { useBlockchainPropertiesControllerGet } from '@energyweb/origin-drec-api-client';
import { CertificateUtils, Contracts, IBlockchainProperties } from '@energyweb/issuer';
import { Wallet } from 'ethers';

export const useApproveOperatorHandler = () => {
    const { data: blockchainProperties, isLoading } = useBlockchainPropertiesControllerGet();

    const web3Interface = useWeb3React<Web3Provider>();
    const { library: web3 } = web3Interface;

    const issuerAccount = Wallet.fromMnemonic(
        process.env.REACT_APP_MNEMONIC!,
        `m/44'/60'/0'/0/${0}`
    );

    const getBlockchainProperties = () => {
        const configuration: IBlockchainProperties = {
            web3,
            registry: Contracts.factories.RegistryExtendedFactory.connect(
                blockchainProperties?.registry,
                web3
            ),
            issuer: Contracts.factories.IssuerFactory.connect(blockchainProperties?.issuer, web3),
            activeUser: web3.getSigner()
        };
        return { configuration };
    };

    const approveOperatorHandler = async () => {
        if (!blockchainProperties) {
            return;
        }
        const { configuration } = getBlockchainProperties();
        return await CertificateUtils.approveOperator(issuerAccount.address, configuration);
    };

    const checkOperatorApprovedForAll = async () => {
        if (!blockchainProperties) {
            return;
        }
        const { configuration } = getBlockchainProperties();
        const isApprovedForAll = await CertificateUtils.isApprovedForAll(
            issuerAccount.address,
            configuration
        );
        return isApprovedForAll;
    };

    return { approveOperatorHandler, checkOperatorApprovedForAll, isLoading };
};
