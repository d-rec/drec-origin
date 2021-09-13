import { useDeviceControllerGetMyDevices } from '@energyweb/origin-drec-api-client';

export const useApiMyDevices = () => {
    const { data: myDevices, isLoading } = useDeviceControllerGetMyDevices();
    return { isLoading, myDevices };
};
