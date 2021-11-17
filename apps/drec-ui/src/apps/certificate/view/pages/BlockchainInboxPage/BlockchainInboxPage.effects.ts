import { useCertificateControllerGetAll } from '@energyweb/origin-drec-api-client';
import { ListAction } from '@energyweb/origin-ui-core';
import { useUser } from 'api';

import {
    useBlockchainInboxLogic,
    useBlockchainInboxPermissionsLogic
} from 'apps/certificate/logic';
import { useApiMyDeviceGroups, useAllFuelTypes } from '../../../data';
import {
    ListItemContent,
    ListItemHeader,
    BlockchainTransferAction,
    RetireAction
} from '../../containers';
import { useTransactionPendingStore } from '../../context';

export const useBlockchainInboxPageEffects = () => {
    const txPending = useTransactionPendingStore();

    const { data: blockchainCertificates, isLoading: areCertificatesLoading } =
        useCertificateControllerGetAll();

    const { myDeviceGroups, isLoading: areDevicesGroupsLoading } = useApiMyDeviceGroups(); // Should be my device groups
    const { allTypes: allFuelTypes, isLoading: areFuelTypesLoading } = useAllFuelTypes();
    const { user, userLoading } = useUser();

    const { canAccessPage, requirementsProps } = useBlockchainInboxPermissionsLogic({
        user
    });

    const isLoading =
        areCertificatesLoading || areDevicesGroupsLoading || areFuelTypesLoading || userLoading;

    const actions: ListAction[] = [
        {
            name: 'Redeem',
            component: RetireAction
        },
        {
            name: 'Transfer',
            component: BlockchainTransferAction
        }
    ];

    const listProps = useBlockchainInboxLogic({
        blockchainCertificates,
        allDeviceGroups: myDeviceGroups,
        allFuelTypes,
        actions,
        ListItemHeader,
        ListItemContent
    });

    const noCertificatesText = `You don't have any certificates in the inbox`;

    return {
        isLoading,
        listProps,
        noCertificatesText,
        canAccessPage,
        requirementsProps,
        txPending
    };
};
