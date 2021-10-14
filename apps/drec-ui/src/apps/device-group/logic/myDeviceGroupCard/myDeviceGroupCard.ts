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
        deviceGroupId: deviceGroup.id,
        deviceGroupName: deviceGroup.name,
        buttonText: 'View details',
        buttonLink: `/device-group/detail-view/${deviceGroup.id}`,
        deleteButtonText: 'Remove group',
        specFieldProps: [
            {
                label: 'Facility ID',
                value: deviceGroup.id.toString()
            },
            {
                label: 'Aggregated Capacity (MW)',
                value: deviceGroup.aggregatedCapacity
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
                label: 'Offtaker',
                value: deviceGroup.offTakers.join().replaceAll(',', ', ')
            },
            {
                label: 'Installation Configuration',
                value: deviceGroup.installationConfigurations.join().replaceAll(',', ', ')
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
