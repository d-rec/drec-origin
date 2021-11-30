import { useParams } from 'react-router';
import { useDeviceGroupDetailData, useAllDeviceFuelTypes } from '../../../data';
import { useDeviceGroupDetailViewLogic, useDevicesTableLogic } from '../../../logic';
import { Pageview } from '@mui/icons-material';
import { useDeviceGroupModalsDispatch, DeviceGroupModalsActionsEnum } from '../../context';
import { DeviceDTO } from '@energyweb/origin-drec-api-client';

export const useDetailViewGroupPageEffects = () => {
    const { id } = useParams();
    const dispatchModals = useDeviceGroupModalsDispatch();

    const { deviceGroup, isLoading: isDeviceGroupLoading } = useDeviceGroupDetailData(+id);

    const { allTypes, isLoading: isDeviceTypesLoading } = useAllDeviceFuelTypes();
    const { locationProps, cardProps } = useDeviceGroupDetailViewLogic({
        deviceGroup,
        owner: deviceGroup?.organization?.name,
        allTypes
    });

    const isLoading = isDeviceGroupLoading || isDeviceTypesLoading;

    const showDetailsHandler = (id: number) => {
        const device = deviceGroup?.devices.find((device: DeviceDTO) => device.id === id);
        dispatchModals({
            type: DeviceGroupModalsActionsEnum.SHOW_DEVICE_DETAILS,
            payload: {
                open: true,
                details: {
                    labels: device?.labels,
                    impactStory: device?.impactStory
                }
            }
        });
    };

    const actions = [
        {
            icon: <Pageview />,
            name: 'View details',
            onClick: (id: DeviceDTO['id']) => showDetailsHandler(id)
        }
    ];

    const tableProps = useDevicesTableLogic(deviceGroup?.devices, actions, isLoading);

    return { locationProps, cardProps, deviceGroup, isLoading, tableProps };
};
