import { DeviceGroupDTO } from '@energyweb/origin-drec-api-client';
import { useAllDeviceFuelTypes, useDeviceGroupDetailViewLogic } from 'apps/device-group';

export const useDeviceGroupDetailsEffects = (deviceGroup: DeviceGroupDTO) => {
    const { allTypes, isLoading } = useAllDeviceFuelTypes();

    const { locationProps, cardProps } = useDeviceGroupDetailViewLogic({
        deviceGroup,
        owner: deviceGroup?.organizationId,
        allTypes
    });

    return { locationProps, cardProps, isLoading, allTypes };
};
