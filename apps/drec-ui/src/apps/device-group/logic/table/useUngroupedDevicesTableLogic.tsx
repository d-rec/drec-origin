import { CodeNameDTO, UngroupedDeviceDTO } from '@energyweb/origin-drec-api-client';
import { TableComponentProps } from '@energyweb/origin-ui-core';
import { Checkbox } from '@material-ui/core';
import { getFuelNameFromCode } from '../../../../utils';

const prepareUngroupedDevicesData = (
    device: UngroupedDeviceDTO,
    allFuelTypes: CodeNameDTO[],
    handleChecked: (id: UngroupedDeviceDTO['id'], checked: boolean) => void
) => ({
    id: device.id,
    projectName: device.projectName,
    country: device.countryCode,
    fuelCode: getFuelNameFromCode(device.fuelCode, allFuelTypes),
    installation: device.installationConfiguration,
    capacity: device.capacityRange,
    age: device.commissioningDateRange,
    offTaker: device.offTaker,
    sector: device.sector,
    standardCompliance: device.standardCompliance,
    checked: (
        <Checkbox
            checked={device.selected}
            color="default"
            size="medium"
            onChange={(event) => handleChecked(device.id, event.target.checked)}
        />
    )
});

export const useUngroupedDevicesTableLogic = (
    devices: UngroupedDeviceDTO[],
    handleChecked: (id: UngroupedDeviceDTO['id'], checked: boolean) => void,
    loading: boolean,
    allFuelTypes: CodeNameDTO[]
): TableComponentProps<UngroupedDeviceDTO['id']> => {
    return {
        header: {
            projectName: 'Project name',
            country: 'Country',
            fuelCode: 'Fuel Code',
            installation: 'Installation',
            capacity: 'Capacity',
            age: 'Age',
            offTaker: 'Offtaker',
            sector: 'Sector',
            standardCompliance: 'Standard Compliance',
            checked: ''
        },
        loading,
        pageSize: 25,
        data:
            devices?.map((device) =>
                prepareUngroupedDevicesData(device, allFuelTypes, handleChecked)
            ) ?? []
    };
};
