import { DeviceDTO, CodeNameDTO } from '@energyweb/origin-drec-api-client';
import { TableComponentProps } from '@energyweb/origin-ui-core';
import { getFuelNameFromCode, PowerFormatter } from '../../../../utils';

const prepareUngroupedDevicesData = (device: DeviceDTO, allFuelTypes: CodeNameDTO[]) => ({
    id: device.id,
    projectName: device.projectName,
    country: device.countryCode,
    fuelCode: getFuelNameFromCode(device.fuelCode, allFuelTypes),
    installation: device.installationConfiguration,
    capacity: PowerFormatter.format(device.capacity, true),
    age: device.commissioningDate,
    offTaker: device.offTaker,
    sector: device.sector,
    standardCompliance: device.standardCompliance
});

export const useUngroupedDevicesTableLogic = (
    devices: DeviceDTO[],
    loading: boolean,
    allFuelTypes: CodeNameDTO[]
): TableComponentProps<DeviceDTO['id']> => {
    return {
        header: {
            projectName: 'Project name',
            country: 'Country',
            fuelCode: 'Fuel Code',
            installation: 'Installation',
            capacity: 'Capacity',
            age: 'Age',
            offTaker: 'Off Taker',
            sector: 'Sector',
            standardCompliance: 'Standard Compliance'
        },
        loading,
        pageSize: 25,
        data: devices?.map((device) => prepareUngroupedDevicesData(device, allFuelTypes)) ?? []
    };
};
