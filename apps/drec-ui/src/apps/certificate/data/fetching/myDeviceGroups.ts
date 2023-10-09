import { useDeviceGroupControllerGetMyDevices } from '@energyweb/origin-drec-api-client';

export const useApiMyDeviceGroups = () => {
    const { data: myDeviceGroups, isLoading } = useDeviceGroupControllerGetMyDevices();
    return { isLoading, myDeviceGroups };
};
