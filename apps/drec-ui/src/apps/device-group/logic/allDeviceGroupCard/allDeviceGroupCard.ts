import { CardWithImageProps, IconTextProps, SpecFieldProps } from '@energyweb/origin-ui-core';
import { EnergyTypeEnum, PowerFormatter } from '@energyweb/origin-ui-utils';
import { TUseSpecsForAllDeviceGroupCard } from './types';
import { getMainFuelType, getEnergyTypeImage } from 'utils';
import { GermanyFlag } from 'assets';

export const useSpecsForAllDeviceGroupCard: TUseSpecsForAllDeviceGroupCard = ({
    deviceGroup,
    allTypes,
    clickHandler
}) => {
    const specsData: SpecFieldProps[] = [
        {
            label: 'Aggregated Capacity (MW)',
            value: PowerFormatter.format(deviceGroup.aggregatedCapacity)
        },
        {
            label: 'Capacity Range',
            value: deviceGroup.capacityRange
        },
        {
            label: 'Commissioning date ranges',
            value: deviceGroup.commissioningDateRange.join()
        }
    ];
    const { mainType, restType } = getMainFuelType(deviceGroup.fuelCode, allTypes);

    const deviceGroupIcon = getEnergyTypeImage(mainType.toLowerCase() as EnergyTypeEnum);
    const iconsData: IconTextProps[] = [
        {
            icon: deviceGroupIcon,
            title: mainType,
            subtitle: restType
        },
        {
            icon: GermanyFlag,
            title: `${deviceGroup.countryCode}`
        }
    ];

    const detailViewLink = `/device-group/detail-view/${deviceGroup.id}`;

    const cardProps: Omit<CardWithImageProps, 'content'> = {
        heading: deviceGroup.name,
        hoverText: 'View details'.toUpperCase(),
        imageUrl: '',
        fallbackIcon: deviceGroupIcon,
        onActionClick: () => clickHandler(detailViewLink)
    };

    return { specsData, iconsData, cardProps };
};
