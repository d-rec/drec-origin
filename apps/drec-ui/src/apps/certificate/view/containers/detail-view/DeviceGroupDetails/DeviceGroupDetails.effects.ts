import { DeviceGroupDTO } from '@energyweb/origin-drec-api-client';
import { useAllDeviceFuelTypes } from '../../../../../device-group';
import { useDeviceGroupDetailsLogic } from '../../../../logic';

export const useDeviceGroupDetailsEffects = (deviceGroup: DeviceGroupDTO) => {
    const { allTypes, isLoading } = useAllDeviceFuelTypes();

    const { locationProps, cardProps } = useDeviceGroupDetailsLogic({
        deviceGroup,
        owner: deviceGroup?.organizationId?.toString(),
        allTypes
    });

    return { locationProps, cardProps, isLoading, allTypes };
};
