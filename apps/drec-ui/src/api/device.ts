import { useDeviceControllerGetAll } from '@energyweb/origin-drec-api-client';

export const useApiAllDevices = () => {
    const { data: allDevices, isLoading: isOriginDevicesLoading } = useDeviceControllerGetAll();

    const isLoading = isOriginDevicesLoading;

    return { allDevices, isLoading };
};
