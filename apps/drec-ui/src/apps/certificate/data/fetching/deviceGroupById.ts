import { DeviceGroupDTO } from '@energyweb/origin-drec-api-client';
import { useApiAllDeviceGroups } from '../../../device-group';

export const useDeviceGroupByExternalRegistryId = (id: string) => {
    const { allDeviceGroups, isLoading } = useApiAllDeviceGroups();

    const foundDeviceGroup: DeviceGroupDTO = id
        ? allDeviceGroups?.find((group) => group.id.toString() === id)
        : null;

    return { foundDeviceGroup, isLoading };
};
