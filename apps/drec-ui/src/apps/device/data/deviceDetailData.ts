import { DeviceDTO, useDeviceControllerGet } from '@energyweb/origin-drec-api-client';

export const useDeviceDetailData = (id: DeviceDTO['id']) => {
    const { data: device, isLoading } = useDeviceControllerGet(id);
    return { device, isLoading };
};
