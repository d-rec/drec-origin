import { useApiAllDevices, useAllDeviceFuelTypes } from '../../../api';

export const useAllDevicesPageEffects = () => {
    const { allDevices, isLoading: isAllDevicesLoading } = useApiAllDevices();
    const { allTypes: allDeviceTypes, isLoading: allTypesLoading } = useAllDeviceFuelTypes();

    const isLoading = isAllDevicesLoading || allTypesLoading;

    return { allDevices, allDeviceTypes, isLoading };
};
