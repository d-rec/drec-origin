import { DeviceGroupDTO } from '@energyweb/origin-drec-api-client/dist/js/src';
import { useApiAllDeviceGroups } from '../../../device-group';

export const useDeviceGroupByExternalRegistryId = (id: string) => {
    const { allDeviceGroups, isLoading } = useApiAllDeviceGroups();

    const deviceGroup: DeviceGroupDTO = id
        ? allDeviceGroups?.find((group) => group.id.toString() === id)
        : null;

    return { deviceGroup, isLoading };
};
