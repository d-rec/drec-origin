import { getDeviceControllerGetAllQueryKey, DeviceDTO } from '@energyweb/origin-drec-api-client';
import { useQueryClient } from 'react-query';

export const useCachedAllDevices = () => {
    const queryClient = useQueryClient();
    const allOriginDevicesQueryKey = getDeviceControllerGetAllQueryKey();

    const cachedAllDevices = queryClient.getQueryData<DeviceDTO[]>(allOriginDevicesQueryKey);

    return cachedAllDevices;
};
