import { DeviceDTO, CodeNameDTO } from '@energyweb/origin-drec-api-client';
import { useDeviceFirstImageUrl } from '../../../../api';
import { useSpecsForMyDeviceCard } from '../../../logic';

export const useMyDeviceCardEffects = (device: DeviceDTO, allTypes: CodeNameDTO[]) => {
    const imageUrl = useDeviceFirstImageUrl(device.images);

    const cardProps = useSpecsForMyDeviceCard({ device, allTypes, imageUrl });

    return cardProps;
};
