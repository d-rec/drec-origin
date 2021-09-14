import {
    getDeviceControllerGetMyDevicesQueryKey,
    DeviceDTO
} from '@energyweb/origin-drec-api-client';
import { useQueryClient } from 'react-query';

export const useCachedMyDevices = () => {
    const queryClient = useQueryClient();
    const myDevicesQueryKey = getDeviceControllerGetMyDevicesQueryKey();

    const cachedMyDevices = queryClient.getQueryData<DeviceDTO[]>(myDevicesQueryKey);

    return cachedMyDevices;
};
