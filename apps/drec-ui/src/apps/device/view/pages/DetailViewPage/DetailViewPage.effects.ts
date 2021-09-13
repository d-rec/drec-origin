import { useParams } from 'react-router';
import { useAllDeviceFuelTypes, useDeviceDetailData } from 'apps/device/data';
import { useDeviceDetailViewLogic } from 'apps/device/logic';

export const useDetailViewPageEffects = () => {
    const { id } = useParams();

    const { device, isLoading: isDeviceLoading } = useDeviceDetailData(+id);

    const { allTypes, isLoading: isDeviceTypesLoading } = useAllDeviceFuelTypes();
    const { locationProps, cardProps } = useDeviceDetailViewLogic({
        device,
        owner: device?.organizationId,
        allTypes
    });

    const isLoading = isDeviceLoading || isDeviceTypesLoading;

    return { locationProps, cardProps, device, isLoading, allTypes };
};
