import {
    DeviceDTO,
    useDeviceControllerGet,
    useDeviceControllerGetAll,
    useDeviceControllerGetFuelTypes
} from '@energyweb/origin-drec-api-client';

export const useApiAllDevices = () => {
    const { data: allDevices, isLoading: isOriginDevicesLoading } = useDeviceControllerGetAll();

    const isLoading = isOriginDevicesLoading;

    return { allDevices, isLoading };
};

export const useAllDeviceFuelTypes = () => {
    const { data: allTypes, isLoading } = useDeviceControllerGetFuelTypes({
        staleTime: 1000000
    });

    return { allTypes, isLoading };
};

export const useDeviceDetailData = (id: DeviceDTO['id']) => {
    const { data, isLoading: isDeviceLoading } = useDeviceControllerGet(id);
    const isLoading = isDeviceLoading;

    const device = !isLoading && data;

    return { device, isLoading };
};
