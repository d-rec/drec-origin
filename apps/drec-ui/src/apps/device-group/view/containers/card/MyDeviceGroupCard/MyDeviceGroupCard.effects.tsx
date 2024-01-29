import { DeviceGroupDTO, CodeNameDTO } from '@energyweb/origin-drec-api-client';
import { useSpecsForMyDeviceGroupCard } from 'apps/device-group/logic';

export const useMyDeviceGroupCardEffects = (
    deviceGroup: DeviceGroupDTO,
    allTypes: CodeNameDTO[]
) => {
    const cardProps = useSpecsForMyDeviceGroupCard({ deviceGroup, allTypes });

    return cardProps;
};
