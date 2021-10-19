import { CardWithImageProps, IconTextProps, SpecFieldProps } from '@energyweb/origin-ui-core';
import { EnergyTypeEnum } from '@energyweb/origin-ui-utils';
import { TUseSpecsForAllDeviceGroupCard } from './types';
import { getMainFuelType, getEnergyTypeImage, PowerFormatter } from 'utils';
import { GermanyFlag } from 'assets';

export const useSpecsForAllDeviceGroupCard: TUseSpecsForAllDeviceGroupCard = ({
    deviceGroup,
    allTypes,
    clickHandler
}) => {
    const specsData: SpecFieldProps[] = [
        {
            label: 'Aggregated Capacity (MW)',
            value: PowerFormatter.format(deviceGroup.aggregatedCapacity, true)
        },
        {
            label: 'Capacity Range',
            value: deviceGroup.capacityRange
        },
        {
            label: 'Commissioning date ranges',
            value: deviceGroup.commissioningDateRange.join().replaceAll(',', ', ')
        },
        {
            label: 'Standard Compliance',
            value: deviceGroup.standardCompliance
        },
        {
            label: 'Offtakers',
            value: deviceGroup.offTakers.join().replaceAll(',', ', ')
        },
        {
            label: 'Installation Configurations',
            value: deviceGroup.installationConfigurations.join().replaceAll(',', ', ')
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
        heading: `Facility ${deviceGroup.id}`,
        hoverText: 'View details'.toUpperCase(),
        imageUrl: '',
        fallbackIcon: deviceGroupIcon,
        onActionClick: () => clickHandler(detailViewLink)
    };

    return { specsData, iconsData, cardProps };
};
