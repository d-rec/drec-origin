import { GroupedDevicesDTO, UngroupedDeviceDTO } from '@energyweb/origin-drec-api-client';
import { useAllDeviceFuelTypes } from '../../../data';
import { useUngroupedDevicesTableLogic } from '../../../logic';
import { Pageview } from '@mui/icons-material';
import { useNavigate } from 'react-router';
import { TableActionData } from '@energyweb/origin-ui-core';

export const useUngroupedDevicesContainerEffects = (
    groupedDevices: GroupedDevicesDTO,
    handleChecked: (id: UngroupedDeviceDTO['id'], checked: boolean) => void
) => {
    const navigate = useNavigate();

    const { allTypes, isLoading } = useAllDeviceFuelTypes();
    const isDisabledCreateGroup: boolean =
        groupedDevices?.devices.filter((device: UngroupedDeviceDTO) => device.selected === true)
            .length === 0;

    const actions: TableActionData<UngroupedDeviceDTO['id']>[] = [
        {
            icon: <Pageview />,
            name: 'View details',
            onClick: (id: UngroupedDeviceDTO['id']) => navigate(`/device-group/detail-view/${id}`)
        }
    ];
    const tableProps = useUngroupedDevicesTableLogic(
        groupedDevices?.devices,
        actions,
        handleChecked,
        isLoading,
        allTypes
    );

    return { tableProps, isDisabledCreateGroup };
};
