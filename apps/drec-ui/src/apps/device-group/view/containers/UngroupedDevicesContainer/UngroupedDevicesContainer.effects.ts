import { GroupedDevicesDTO, UngroupedDeviceDTO } from '@energyweb/origin-drec-api-client';
import { useAllDeviceFuelTypes } from '../../../data';
import { useUngroupedDevicesTableLogic } from '../../../logic';

export const useUngroupedDevicesContainerEffects = (
    groupedDevices: GroupedDevicesDTO,
    handleChecked: (id: UngroupedDeviceDTO['id'], checked: boolean) => void
) => {
    const { allTypes, isLoading } = useAllDeviceFuelTypes();
    const isDisabledCreateGroup: boolean =
        groupedDevices.devices.filter((device: UngroupedDeviceDTO) => device.selected === true)
            .length === 0;
    const tableProps = useUngroupedDevicesTableLogic(
        groupedDevices.devices,
        handleChecked,
        isLoading,
        allTypes
    );

    return { tableProps, isDisabledCreateGroup };
};
