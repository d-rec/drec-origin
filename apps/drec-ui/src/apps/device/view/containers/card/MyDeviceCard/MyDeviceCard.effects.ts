import { DeviceDTO, CodeNameDTO } from '@energyweb/origin-drec-api-client';
import { useDeviceFirstImageUrl } from 'apps/device/data';
import { useSpecsForMyDeviceCard } from 'apps/device/logic';

export const useMyDeviceCardEffects = (device: DeviceDTO, allTypes: CodeNameDTO[]) => {
    const imageUrl = useDeviceFirstImageUrl(device.images);

    const cardProps = useSpecsForMyDeviceCard({ device, allTypes, imageUrl });

    return cardProps;
};
