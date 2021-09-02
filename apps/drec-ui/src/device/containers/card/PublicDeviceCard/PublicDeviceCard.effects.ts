import { DeviceDTO, CodeNameDTO } from '@energyweb/origin-drec-api-client';
import { useSpecsForAllDeviceCard } from '../../../logic';
import { useNavigate } from 'react-router';
import { useDeviceFirstImageUrl } from '../../../../api';

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
