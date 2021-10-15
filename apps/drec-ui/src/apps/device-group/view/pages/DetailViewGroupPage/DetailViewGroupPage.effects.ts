import { useParams } from 'react-router';
import { useDeviceGroupDetailData } from '../../../data';
import { useAllDeviceFuelTypes } from 'apps/device/data';
import { useDeviceGroupDetailViewLogic } from '../../../logic';

export const useDetailViewGroupPageEffects = () => {
    const { id } = useParams();

    const { deviceGroup, isLoading: isDeviceGroupLoading } = useDeviceGroupDetailData(+id);

    const { allTypes, isLoading: isDeviceTypesLoading } = useAllDeviceFuelTypes();
    const { locationProps, cardProps } = useDeviceGroupDetailViewLogic({
        deviceGroup,
        owner: deviceGroup?.organizationId,
        allTypes
    });

    const isLoading = isDeviceGroupLoading || isDeviceTypesLoading;

    return { locationProps, cardProps, deviceGroup, isLoading, allTypes };
};
