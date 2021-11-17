import {
    DeviceGroupDTO,
    getDeviceGroupControllerGetMyDevicesQueryKey
} from '@energyweb/origin-drec-api-client';
import { useQueryClient } from 'react-query';

export const useCachedMyDeviceGroups = () => {
    const queryClient = useQueryClient();
    const myDevicesQueryKey = getDeviceGroupControllerGetMyDevicesQueryKey();

    const cachedMyDeviceGroups = queryClient.getQueryData<DeviceGroupDTO[]>(myDevicesQueryKey);

    return cachedMyDeviceGroups;
};
