import { EnergyTypeEnum } from '@energyweb/origin-ui-utils';
import { TUseDeviceGroupDetailsLogic } from './types';
import { getMainFuelType, getEnergyTypeImage } from 'utils';

export const useDeviceGroupDetailsLogic: TUseDeviceGroupDetailsLogic = ({
    deviceGroup,
    owner,
    allTypes
}) => {
    const locationProps = {
        owner: `Device owner organization id ${owner}`,
        location: `${deviceGroup?.countryCode}`
    };

    const { mainType, restType } = getMainFuelType(deviceGroup?.fuelCode, allTypes);
    const deviceGroupIcon = getEnergyTypeImage(mainType.toLowerCase() as EnergyTypeEnum);

    const cardProps = {
        headingIconProps: {
            icon: deviceGroupIcon,
            title: mainType,
            subtitle: restType
        }
    };

    return {
        locationProps,
        cardProps
    };
};
