import { DeviceDTO, CodeNameDTO } from '@energyweb/origin-drec-api-client';
import { useNavigate } from 'react-router';
import { useDeviceFirstImageUrl } from 'apps/device/data';
import { useSpecsForAllDeviceCard } from 'apps/device/logic';

type TUsePublicDeviceCardEffectsArgs = {
    device: DeviceDTO;
    allDeviceTypes: CodeNameDTO[];
};

export const usePublicDeviceCardEffects = ({
    device,
    allDeviceTypes
}: TUsePublicDeviceCardEffectsArgs) => {
    const navigate = useNavigate();
    const imageUrl = useDeviceFirstImageUrl(device.images);

    const viewDetailsClickHandler = (link: string) => navigate(link);

    const { specsData, iconsData, cardProps } = useSpecsForAllDeviceCard({
        device,
        allTypes: allDeviceTypes,
        clickHandler: viewDetailsClickHandler,
        imageUrl
    });

    return { specsData, iconsData, cardProps };
};
