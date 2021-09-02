import { CardWithImageProps, IconTextProps, SpecFieldProps } from '@energyweb/origin-ui-core';
import { EnergyTypeEnum, PowerFormatter } from '@energyweb/origin-ui-utils';
import { TUseSpecsForAllDeviceCard } from './types';
import { getMainFuelType, getEnergyTypeImage, getDeviceAgeInYears } from '../../utils';

export const useSpecsForAllDeviceCard: TUseSpecsForAllDeviceCard = ({
    device,
    allTypes,
    clickHandler,
    imageUrl
}) => {
    const specsData: SpecFieldProps[] = [
        {
            label: 'Capacity (MW)',
            value: PowerFormatter.format(device.capacity)
        },
        {
            label: 'Age (Years)',
            value: getDeviceAgeInYears(device.commissioningDate)
        }
    ];
    const { mainType, restType } = getMainFuelType(device.fuelCode, allTypes);

    const deviceIcon = getEnergyTypeImage(mainType.toLowerCase() as EnergyTypeEnum);
    const iconsData: IconTextProps[] = [
        {
            icon: deviceIcon,
            title: mainType,
            subtitle: restType
        }
    ];

    const detailViewLink = `/device/detail-view/${device.id}`;

    const cardProps: Omit<CardWithImageProps, 'content'> = {
        heading: device.projectName,
        hoverText: 'View details'.toUpperCase(),
        imageUrl,
        fallbackIcon: deviceIcon,
        onActionClick: () => clickHandler(detailViewLink)
    };

    return { specsData, iconsData, cardProps };
};
