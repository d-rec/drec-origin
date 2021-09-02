import { EnergyTypeEnum, PowerFormatter } from '@energyweb/origin-ui-utils';
import { GermanyFlag } from '../../../assets';
import { getEnergyTypeImage, getMainFuelType } from '../../utils';
import { TUseSpecsForMyDeviceCard, TUseSpecsForMyDeviceCardReturnType } from './types';

export const useSpecsForMyDeviceCard: TUseSpecsForMyDeviceCard = ({
    device,
    allTypes,
    imageUrl
}) => {
    const { mainType, restType } = getMainFuelType(device.fuelCode, allTypes);
    const deviceIconRegular = getEnergyTypeImage(mainType.toLowerCase() as EnergyTypeEnum);

    const cardHeaderProps: TUseSpecsForMyDeviceCardReturnType['cardHeaderProps'] = {
        deviceName: device.projectName,
        buttonText: 'View details',
        buttonLink: `/device/detail-view/${device.id}`,
        specFieldProps: {
            label: 'Capacity (MW)',
            value: PowerFormatter.format(device.capacity)
        }
    };

    const cardContentProps: TUseSpecsForMyDeviceCardReturnType['cardContentProps'] = {
        iconsProps: [
            {
                icon: deviceIconRegular,
                title: mainType,
                subtitle: restType
            },
            {
                icon: GermanyFlag,
                title: `${device.countryCode}`
            }
        ]
    };

    return {
        imageUrl,
        fallbackIcon: deviceIconRegular,
        cardHeaderProps,
        cardContentProps
    };
};
