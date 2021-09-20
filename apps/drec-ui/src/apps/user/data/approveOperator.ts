import { useWeb3React } from '@web3-react/core';
import { useQueryClient } from 'react-query';
import { Web3Provider } from '@ethersproject/providers';
import {
    BlockchainPropertiesDTO,
    getBlockchainPropertiesControllerGetQueryKey,
    useBlockchainPropertiesControllerGet
} from '@energyweb/origin-drec-api-client';
import { CertificateUtils } from '@energyweb/issuer';
import { getBlockchainConfiguration } from 'utils';
import { NotificationTypeEnum, showNotification } from 'shared';

export const useApproveOperatorHandler = (
    issuerAddress: string,
    setIsGivingApproval: (value: boolean) => void
) => {
    const queryClient = useQueryClient();
    const { data: blockchainProperties, isLoading } = useBlockchainPropertiesControllerGet();
    const blockchainPropertiesQueryKey = getBlockchainPropertiesControllerGetQueryKey();
    const { library } = useWeb3React<Web3Provider>();

    const approveOperatorHandler = async () => {
        if (!blockchainProperties) return;

        const configuration = getBlockchainConfiguration(library, blockchainProperties);

        try {
            const transaction = await CertificateUtils.approveOperator(
                issuerAddress,
                configuration
            );

            setIsGivingApproval(true);
            const receipt = await transaction.wait();

            if (receipt.status === 0) {
                throw new Error('Transaction failed');
            } else {
                setIsGivingApproval(false);
                showNotification(
                    'You have successfully give an operator approval',
                    NotificationTypeEnum.Success
                );
                queryClient.resetQueries(blockchainPropertiesQueryKey);
            }
        } catch (error) {
            setIsGivingApproval(false);
            showNotification('Error while giving operator approval', NotificationTypeEnum.Error);
            console.error(error);
        }
    };

    const checkOperatorApprovedForAll = async (
        web3: Web3Provider,
        blockchainProps: BlockchainPropertiesDTO
    ) => {
        if (!blockchainProps) return;

        const configuration = getBlockchainConfiguration(web3, blockchainProps);
        try {
            const isApprovedForAll = await CertificateUtils.isApprovedForAll(
                issuerAddress,
                configuration
            );
            return isApprovedForAll;
        } catch (error) {
            console.error(error);
        }
    };

    return { approveOperatorHandler, checkOperatorApprovedForAll, isLoading, blockchainProperties };
};
