import { useDeviceControllerGetAllUngrouped } from '@energyweb/origin-drec-api-client';
import { DeviceOrderBy } from '../../../utils';

export const useUngroupedDevices = (orderBy: DeviceOrderBy[], enableFetch: boolean) => {
    const { data: groupedDevicesList, isLoading } = useDeviceControllerGetAllUngrouped(
        { orderBy },
        {
            query: { enabled: enableFetch }
        }
    );
    return { groupedDevicesList, isLoading };
};
