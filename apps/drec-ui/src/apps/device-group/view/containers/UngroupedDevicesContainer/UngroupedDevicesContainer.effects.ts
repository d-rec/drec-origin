import { GroupedDevicesDTO } from '@energyweb/origin-drec-api-client';
import { useAllDeviceFuelTypes } from '../../../data';
import { useUngroupedDevicesTableLogic } from '../../../logic';

export const useUngroupedDevicesContainerEffects = (groupedDevices: GroupedDevicesDTO) => {
    const { allTypes, isLoading } = useAllDeviceFuelTypes();

    const tableProps = useUngroupedDevicesTableLogic(groupedDevices.devices, isLoading, allTypes);

    return { tableProps };
};
