import { useAllDeviceFuelTypes } from 'apps/device/data';
import { useApiAllDeviceGroups } from 'apps/device-group/data';

export const useAllDeviceGroupsPageEffects = () => {
    const { allDeviceGroups, isLoading: isAllDevicesLoading } = useApiAllDeviceGroups();
    const { allTypes: allDeviceTypes, isLoading: allTypesLoading } = useAllDeviceFuelTypes();

    const isLoading = isAllDevicesLoading || allTypesLoading;

    return { allDeviceGroups, allDeviceTypes, isLoading };
};
