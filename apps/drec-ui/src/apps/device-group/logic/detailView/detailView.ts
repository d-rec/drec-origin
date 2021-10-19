import { EnergyTypeEnum, getEnergyTypeImage, getMainFuelType, PowerFormatter } from 'utils';
import { TUseDeviceGroupDetailViewLogic } from './types';

export const useDeviceGroupDetailViewLogic: TUseDeviceGroupDetailViewLogic = ({
    deviceGroup,
    owner,
    allTypes
}) => {
    const locationProps = {
        // @should be changed to actual owner name
        owner: `DeviceGroup owner organization id ${owner}`,
        location: `${deviceGroup?.countryCode}`
    };

    const { mainType, restType } = getMainFuelType(deviceGroup?.fuelCode, allTypes);
    const deviceIcon = getEnergyTypeImage(mainType.toLowerCase() as EnergyTypeEnum);

    const cardProps = {
        headingIconProps: {
            icon: deviceIcon,
            title: mainType,
            subtitle: restType
        },
        specFields: [
            {
                label: 'Facility ID',
                value: deviceGroup?.id.toString()
            },
            {
                label: 'Standard Compliance',
                value: deviceGroup?.standardCompliance
            },
            {
                label: 'Aggregated Capacity (MW)',
                value: PowerFormatter.format(deviceGroup?.aggregatedCapacity, true)
            },
            {
                label: 'Capacity Range',
                value: deviceGroup?.capacityRange
            },
            {
                label: 'Offtakers',
                value: deviceGroup?.offTakers.join().replaceAll(',', ', ')
            },
            {
                label: 'Sector',
                value: deviceGroup?.sectors.join().replaceAll(',', ', ')
            },
            {
                label: 'Installation Configuration',
                value: deviceGroup?.installationConfigurations.join().replaceAll(',', ', ')
            },
            {
                label: 'Commissioning date ranges',
                value: deviceGroup?.commissioningDateRange.join().replaceAll(',', ', ')
            },
            {
                label: 'Yield value',
                value: deviceGroup?.yieldValue
            },
            {
                label: 'Labels',
                value: deviceGroup?.labels.join().replaceAll(',', ', ')
            }
        ]
    };

    return {
        locationProps,
        cardProps
    };
};
