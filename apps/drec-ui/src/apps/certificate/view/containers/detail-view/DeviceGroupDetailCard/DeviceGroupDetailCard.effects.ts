import { DeviceGroupDTO } from '@energyweb/origin-drec-api-client';
import { useNavigate } from 'react-router';

export const useDeviceGroupDetailCardEffects = (deviceGroupId: DeviceGroupDTO['id']) => {
    const navigate = useNavigate();

    const handleViewDeviceGroup = () => {
        navigate(`/device-group/detail-view/${deviceGroupId}`);
    };

    const viewDeviceText = 'View Device Group';

    return { viewDeviceText, handleViewDeviceGroup };
};
