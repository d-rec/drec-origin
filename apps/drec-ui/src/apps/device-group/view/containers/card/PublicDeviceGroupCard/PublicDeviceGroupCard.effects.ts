import { DeviceGroupDTO, CodeNameDTO } from '@energyweb/origin-drec-api-client';
import { useNavigate } from 'react-router';
import { useSpecsForAllDeviceGroupCard } from 'apps/device-group/logic';

type TUsePublicDeviceCardEffectsArgs = {
    deviceGroup: DeviceGroupDTO;
    allDeviceTypes: CodeNameDTO[];
};

export const usePublicDeviceGroupCardEffects = ({
    deviceGroup,
    allDeviceTypes
}: TUsePublicDeviceCardEffectsArgs) => {
    const navigate = useNavigate();

    const viewDetailsClickHandler = (link: string) => navigate(link);

    const { specsData, iconsData, cardProps } = useSpecsForAllDeviceGroupCard({
        deviceGroup,
        allTypes: allDeviceTypes,
        clickHandler: viewDetailsClickHandler
    });

    return { specsData, iconsData, cardProps };
};
