import {
    useAllFuelTypes,
    useApiAllDeviceGroups,
    useApiUser,
    useRedeemedCertificates
} from '../../../data';
import { useLogicRedemptionsReport, usePermissionsLogic } from '../../../logic';

export const useRedemptionReportPageEffects = () => {
    const { user, isLoading: userLoading } = useApiUser();
    const { canAccessPage, requirementsProps } = usePermissionsLogic({
        user
    });

    const {
        redeemedCertificates,
        blockchainCertificates,
        isLoading: areClaimedLoading
    } = useRedeemedCertificates();

    const { allDeviceGroups: deviceGroups, isLoading: areDeviceGroupsLoading } =
        useApiAllDeviceGroups();

    const { allTypes: allFuelTypes, isLoading: isFuelTypesloading } = useAllFuelTypes();

    const loading =
        areClaimedLoading || isFuelTypesloading || areDeviceGroupsLoading || userLoading;

    const tableData = useLogicRedemptionsReport({
        deviceGroups,
        allFuelTypes,
        blockchainCertificates,
        redeemedCertificates,
        loading
    });

    return {
        tableData,
        canAccessPage,
        requirementsProps
    };
};
