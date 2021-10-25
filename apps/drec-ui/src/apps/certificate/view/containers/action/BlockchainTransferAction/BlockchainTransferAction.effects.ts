import { CertificateDTO } from '@energyweb/origin-drec-api-client';
import { ChangeEvent, useState } from 'react';
import { useTransactionPendingDispatch } from 'apps/certificate/view/context';
import {
    useBlockchainTransferCertificateHandler,
    useCachedAllDeviceGroups,
    useCachedAllFuelTypes,
    useCachedBlockchainCertificates
} from 'apps/certificate/data';
import { useBlockchainTransferActionLogic } from 'apps/certificate/logic';

export const useBlockchainTransferActionEffects = (
    selectedIds: CertificateDTO['id'][],
    resetIds: () => void
) => {
    const [recipientAddress, setRecipientAddress] = useState('');

    const handleAddressChange = (event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setRecipientAddress(event.target.value);
    };

    const blockchainCertificates = useCachedBlockchainCertificates();
    const allDeviceGroups = useCachedAllDeviceGroups();
    const allFuelTypes = useCachedAllFuelTypes();
    const setTxPending = useTransactionPendingDispatch();

    const { transferHandler, isLoading } = useBlockchainTransferCertificateHandler(
        recipientAddress,
        resetIds,
        setTxPending
    );

    const actionLogic = useBlockchainTransferActionLogic({
        selectedIds,
        blockchainCertificates,
        allDeviceGroups,
        allFuelTypes
    });

    const buttonDisabled = !recipientAddress || recipientAddress.length !== 42;
    const errorExists = !!recipientAddress && recipientAddress.length !== 42;
    const errorText = 'Please, enter valid address';

    return {
        ...actionLogic,
        recipientAddress,
        handleAddressChange,
        transferHandler,
        isLoading,
        buttonDisabled,
        errorExists,
        errorText
    };
};
