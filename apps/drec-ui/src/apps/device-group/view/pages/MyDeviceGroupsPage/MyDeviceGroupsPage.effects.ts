import { useAllDeviceFuelTypes } from 'apps/device/data';
import { useApiMyDeviceGroups } from 'apps/device-group/data';

export const useMyDeviceGroupsPageEffects = () => {
    const { myDeviceGroups, isLoading: myDeviceGroupsLoading } = useApiMyDeviceGroups();
    const { allTypes: allDeviceTypes, isLoading: allTypesLoading } = useAllDeviceFuelTypes();

    const isLoading = myDeviceGroupsLoading || allTypesLoading;

    return {
        myDeviceGroups,
        allDeviceTypes,
        isLoading
    };
};
