import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { Certificate } from '@energyweb/issuer';
import { useBlockchainPropertiesControllerGet } from '@energyweb/origin-drec-api-client';
import { getBlockchainConfiguration } from 'utils';

export const useGetBlockchainCertificateHandler = () => {
    const { data: blockchainProperties, isLoading } = useBlockchainPropertiesControllerGet();

    const { library: web3 } = useWeb3React<Web3Provider>();

    const getBlockchainCertificate = async (id: number) => {
        const configuration = getBlockchainConfiguration(web3, blockchainProperties);

        const certificate = new Certificate(id, configuration);
        await certificate.sync();
        return certificate;
    };

    return { getBlockchainCertificate, isLoading };
};
