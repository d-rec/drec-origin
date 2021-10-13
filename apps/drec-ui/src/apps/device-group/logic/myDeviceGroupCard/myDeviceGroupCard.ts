import { EnergyTypeEnum, PowerFormatter } from '@energyweb/origin-ui-utils';
import { GermanyFlag } from 'assets';
import { getEnergyTypeImage, getMainFuelType } from 'utils';
import { TUseSpecsForMyDeviceGroupCard, TUseSpecsForMyDeviceGroupCardReturnType } from './types';

export const useSpecsForMyDeviceGroupCard: TUseSpecsForMyDeviceGroupCard = ({
    deviceGroup,
    allTypes
}) => {
    const { mainType, restType } = getMainFuelType(deviceGroup.fuelCode, allTypes);
    const deviceGroupIconRegular = getEnergyTypeImage(mainType.toLowerCase() as EnergyTypeEnum);

    const cardHeaderProps: TUseSpecsForMyDeviceGroupCardReturnType['cardHeaderProps'] = {
        deviceGroupName: deviceGroup.name,
        buttonText: 'View details',
        buttonLink: `/device-group/detail-view/${deviceGroup.id}`,
        specFieldProps: {
            label: 'Aggregated Capacity (MW)',
            value: PowerFormatter.format(deviceGroup.aggregatedCapacity)
        }
    };

    const cardContentProps: TUseSpecsForMyDeviceGroupCardReturnType['cardContentProps'] = {
        iconsProps: [
            {
                icon: deviceGroupIconRegular,
                title: mainType,
                subtitle: restType
            },
            {
                icon: GermanyFlag,
                title: `${deviceGroup.countryCode}`
            }
        ]
    };

    return {
        fallbackIcon: deviceGroupIconRegular,
        cardHeaderProps,
        cardContentProps
    };
};
