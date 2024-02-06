import {
    DeviceGroupDTO,
    getDeviceGroupControllerGetAllQueryKey
} from '@energyweb/origin-drec-api-client';
import { useQueryClient } from 'react-query';

export const useCachedAllDeviceGroups = () => {
    const queryClient = useQueryClient();
    const allOriginDevicesQueryKey = getDeviceGroupControllerGetAllQueryKey();

    const cachedAllDeviceGroups =
        queryClient.getQueryData<DeviceGroupDTO[]>(allOriginDevicesQueryKey);

    return cachedAllDeviceGroups;
};
