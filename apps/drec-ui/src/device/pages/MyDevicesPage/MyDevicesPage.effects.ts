import { useAllDeviceFuelTypes, useApiMyDevices } from '../../../api';

export const useMyDevicePageEffects = () => {
    const { myDevices, isLoading: myDevicesLoading } = useApiMyDevices();
    const { allTypes: allDeviceTypes, isLoading: allTypesLoading } = useAllDeviceFuelTypes();

    const isLoading = myDevicesLoading || allTypesLoading;

    return {
        myDevices,
        allDeviceTypes,
        isLoading
    };
};
