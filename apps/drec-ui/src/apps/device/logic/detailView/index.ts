import {
    EnergyTypeEnum,
    getDeviceAgeInYears,
    getEnergyTypeImage,
    getMainFuelType,
    PowerFormatter
} from 'utils';
import { TUseDeviceDetailViewLogic } from '../types';

export const useDeviceDetailViewLogic: TUseDeviceDetailViewLogic = ({
    device,
    owner,
    allTypes
}) => {
    const locationProps = {
        // @should be changed to actual owner name
        owner: `Device owner organization id ${owner}`,
        location: `${device?.countryCode}`,
        coordinates: `${device?.latitude}, ${device?.longitude}`
    };

    const { mainType, restType } = getMainFuelType(device?.fuelCode, allTypes);
    const deviceIcon = getEnergyTypeImage(mainType.toLowerCase() as EnergyTypeEnum);

    const cardProps = {
        headingIconProps: {
            icon: deviceIcon,
            title: mainType,
            subtitle: restType
        },
        specFields: [
            {
                label: 'Project name',
                value: device?.projectName
            },
            {
                label: 'D-REC ID',
                value: device?.drecID
            },
            {
                label: 'Status',
                value: device?.status
            },
            {
                label: 'Address',
                value: device?.address
            },
            {
                label: 'Zip Code',
                value: device?.zipCode
            },
            {
                label: 'Installation',
                value: device?.installationConfiguration
            },
            {
                label: 'Capacity (MW)',
                value: PowerFormatter.format(device?.capacity)
            },
            {
                label: 'Age (Years)',
                value: getDeviceAgeInYears(device?.commissioningDate)
            },
            {
                label: 'Offtaker',
                value: device?.offTaker
            },
            {
                label: 'Sector',
                value: device?.sector
            },
            {
                label: 'Standard Compliance',
                value: device?.standardCompliance
            },
            {
                label: 'Labels',
                value: device?.labels
            }
        ]
    };

    return {
        locationProps,
        cardProps
    };
};
