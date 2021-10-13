import { useDeviceGroupControllerGetAll } from '@energyweb/origin-drec-api-client';

export const useApiAllDeviceGroups = () => {
    const { data: allDeviceGroups, isLoading: isOriginDevicesLoading } =
        useDeviceGroupControllerGetAll();

    const isLoading = isOriginDevicesLoading;

    return { allDeviceGroups, isLoading };
};
