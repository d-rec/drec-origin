import { useDeviceGroupControllerGetAll } from '@energyweb/origin-drec-api-client';

export const useApiAllDeviceGroups = () => {
    const { data: allDeviceGroups, isLoading } = useDeviceGroupControllerGetAll();

    return { allDeviceGroups, isLoading };
};
