import { useParams } from 'react-router';
import { useDeviceGroupDetailData, useAllDeviceFuelTypes } from '../../../data';
import { useDeviceGroupDetailViewLogic, useDevicesTableLogic } from '../../../logic';

export const useDetailViewGroupPageEffects = () => {
    const { id } = useParams();

    const { deviceGroup, isLoading: isDeviceGroupLoading } = useDeviceGroupDetailData(+id);

    const { allTypes, isLoading: isDeviceTypesLoading } = useAllDeviceFuelTypes();
    const { locationProps, cardProps } = useDeviceGroupDetailViewLogic({
        deviceGroup,
        owner: deviceGroup?.organization?.name,
        allTypes
    });

    const isLoading = isDeviceGroupLoading || isDeviceTypesLoading;

    const tableProps = useDevicesTableLogic(deviceGroup?.devices, isLoading);

    return { locationProps, cardProps, deviceGroup, isLoading, tableProps };
};
