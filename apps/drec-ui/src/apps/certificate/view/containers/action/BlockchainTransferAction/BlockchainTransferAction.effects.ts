import { CertificateDTO } from '@energyweb/origin-drec-api-client';
import { ChangeEvent, useState } from 'react';
import { useTransactionPendingDispatch } from '../../../context';
import {
    useBlockchainTransferCertificateHandler,
    useCachedAllDevices,
    useCachedAllFuelTypes,
    useCachedBlockchainCertificates
} from '../../../../logic';
import { useBlockchainTransferActionLogic } from '../../../../logic';

export const useBlockchainTransferActionEffects = (
    selectedIds: CertificateDTO['id'][],
    resetIds: () => void
) => {
    const [recipientAddress, setRecipientAddress] = useState('');

    const handleAddressChange = (event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setRecipientAddress(event.target.value);
    };

    const blockchainCertificates = useCachedBlockchainCertificates();
    const allDevices = useCachedAllDevices();
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
        allDevices,
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
