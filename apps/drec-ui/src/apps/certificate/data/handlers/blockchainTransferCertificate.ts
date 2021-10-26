import {
    CertificateDTO,
    getCertificateControllerGetAllQueryKey
} from '@energyweb/origin-drec-api-client';
import { NotificationTypeEnum, showNotification } from '@energyweb/origin-ui-core';
import { BigNumber } from 'ethers';
import { Dispatch, SetStateAction } from 'react';
import { useQueryClient } from 'react-query';
import { PowerFormatter } from '../../../../utils';
import { useGetBlockchainCertificateHandler } from '../fetching';

export const useBlockchainTransferCertificateHandler = (
    receiverAddress: string,
    resetList: () => void,
    setTxPending: Dispatch<SetStateAction<boolean>>
) => {
    const queryClient = useQueryClient();
    const blockchainCertificatesQueryKey = getCertificateControllerGetAllQueryKey();

    const { getBlockchainCertificate, isLoading: isGetBlockchainLoading } =
        useGetBlockchainCertificateHandler();

    const transferHandler = async <Id>(id: Id, amount: string) => {
        try {
            const onChainCertificate = await getBlockchainCertificate(
                id as unknown as CertificateDTO['id']
            );
            const formattedAmount = BigNumber.from(
                PowerFormatter.getBaseValueFromValueInDisplayUnit(Number(amount))
            );

            const transaction = await onChainCertificate.transfer(receiverAddress, formattedAmount);
            setTxPending(true);
            const receipt = await transaction.wait();
            if (receipt.status === 0) {
                throw new Error('Transaction failed');
            } else {
                setTxPending(false);
                showNotification(
                    'Certificate has been successfully transfered',
                    NotificationTypeEnum.Success
                );
                queryClient.resetQueries(blockchainCertificatesQueryKey);
                resetList();
            }
        } catch (error) {
            showNotification('Error while transfering certificate', NotificationTypeEnum.Error);
        }
    };

    const isLoading = isGetBlockchainLoading;

    return { transferHandler, isLoading };
};
