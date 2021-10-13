import { DeviceGroupDTO, useDeviceGroupControllerGet } from '@energyweb/origin-drec-api-client';

export const useDeviceGroupDetailData = (id: DeviceGroupDTO['id']) => {
    const { data: deviceGroup, isLoading } = useDeviceGroupControllerGet(id);
    return { deviceGroup, isLoading };
};
