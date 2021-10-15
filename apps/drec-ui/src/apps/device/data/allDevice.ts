import { useDeviceControllerGetAll } from '@energyweb/origin-drec-api-client';

export const useApiAllDevices = () => {
    const { data: allDevices, isLoading } = useDeviceControllerGetAll();
    return { allDevices, isLoading };
};
