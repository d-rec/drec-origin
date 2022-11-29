import { IClaimData } from '@energyweb/issuer';
import {
    CertificateDTO,
    getCertificateControllerGetAllQueryKey,
    OrganizationDTO
} from '@energyweb/origin-drec-api-client';

import { NotificationTypeEnum, showNotification } from '@energyweb/origin-ui-core';
import { Dayjs } from 'dayjs';
import { BigNumber } from 'ethers';
import { Dispatch, SetStateAction } from 'react';
import { useQueryClient } from 'react-query';
import { PowerFormatter } from '../../../../utils';
import { useGetBlockchainCertificateHandler } from '../fetching';

export const useRetireCertificateHandler = (
    selectedBeneficiary: OrganizationDTO,
    resetList: () => void,
    beneficiaryname: string,
    beneficiaryaddress: string,
    startDate: Dayjs,
    endDate: Dayjs,
    purpose: string,
    setTxPending: Dispatch<SetStateAction<boolean>>
) => {
    const queryClient = useQueryClient();
    const blockchainCertificatesQueryKey = getCertificateControllerGetAllQueryKey();
console.log(beneficiaryname);
console.log(beneficiaryaddress);
    const { getBlockchainCertificate, isLoading: isGetBlockchainLoading } =
        useGetBlockchainCertificateHandler();

    const retireHandler = async <Id>(id: Id, amount: string) => {
        try {
            const onChainCertificate = await getBlockchainCertificate(
                id as unknown as CertificateDTO['id']
            );
            const formattedAmount = BigNumber.from(
                PowerFormatter.getBaseValueFromValueInDisplayUnit(Number(amount))
            );
            const claimData: IClaimData = {
                beneficiary: beneficiaryname,
                location: beneficiaryaddress,
                countryCode: selectedBeneficiary.country,
                periodStartDate: startDate.toISOString(),
                periodEndDate: endDate.toISOString(),
                purpose
            };
            console.log(claimData);
            const transaction = await onChainCertificate.claim(claimData, formattedAmount);
            setTxPending(true);
            const receipt = await transaction.wait();
            if (receipt.status === 0) {
                throw new Error('Transaction failed');
            } else {
                setTxPending(false);
                showNotification(
                    'Certificate has been successfully redeemed',
                    NotificationTypeEnum.Success
                );
                queryClient.resetQueries(blockchainCertificatesQueryKey);
                resetList();
            }
        } catch (error) {
            console.error("error");
            console.error(error);
            showNotification('Error while redeeming certificate', NotificationTypeEnum.Error);
        }
    };

    const isLoading = isGetBlockchainLoading;

    return { retireHandler, isLoading };
};
