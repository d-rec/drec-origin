import { EnergyTypeEnum } from '@energyweb/origin-ui-utils';
import { Flag } from 'assets';
import { getEnergyTypeImage, getMainFuelType, PowerFormatter } from 'utils';
import { TUseSpecsForMyDeviceGroupCard, TUseSpecsForMyDeviceGroupCardReturnType } from './types';

export const useSpecsForMyDeviceGroupCard: TUseSpecsForMyDeviceGroupCard = ({
    deviceGroup,
    allTypes
}) => {
    const { mainType, restType } = getMainFuelType(deviceGroup.fuelCode, allTypes);
    const deviceGroupIconRegular = getEnergyTypeImage(mainType.toLowerCase() as EnergyTypeEnum);

    const cardHeaderProps: TUseSpecsForMyDeviceGroupCardReturnType['cardHeaderProps'] = {
        deviceGroupId: deviceGroup.id,
        deviceGroupName: deviceGroup.name.replaceAll(',', ' '),
        buttonText: 'View details',
        buttonLink: `/device-group/detail-view/${deviceGroup.id}`,
        groupAttributes: [
            [
                {
                    label: 'Standard Compliance',
                    value: deviceGroup.standardCompliance
                },
                {
                    label: 'Installation Configurations',
                    value: deviceGroup.installationConfigurations.join().replaceAll(',', ', ')
                }
            ],
            [
                {
                    label: 'Aggregated Capacity',
                    value: PowerFormatter.capacityFormatDisplay(
                        deviceGroup.aggregatedCapacity,
                        true
                    )
                },
                {
                    label: 'Capacity Range',
                    value: deviceGroup.capacityRange
                }
            ]
        ],
        specFieldProps: [
            {
                label: 'Offtakers',
                value: deviceGroup.offTakers.join().replaceAll(',', ', ')
            },
            {
                label: 'Sector',
                value: deviceGroup?.sectors.join().replaceAll(',', ', ')
            },
            {
                label: 'Commissioning date ranges',
                value: deviceGroup.commissioningDateRange.join().replaceAll(',', ', ')
            }
        ]
    };

    const cardContentProps: TUseSpecsForMyDeviceGroupCardReturnType['cardContentProps'] = {
        iconsProps: [
            {
                icon: deviceGroupIconRegular,
                title: mainType,
                subtitle: restType
            },
            {
                icon: Flag,
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
