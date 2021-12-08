import { CodeNameDTO, UngroupedDeviceDTO } from '@energyweb/origin-drec-api-client';
import { TableActionData, TableComponentProps } from '@energyweb/origin-ui-core';
import { Checkbox } from '@mui/material';
import { getFuelNameFromCode } from '../../../../utils';
import { Countries } from '@energyweb/utils-general';

const prepareUngroupedDevicesData = (
    device: UngroupedDeviceDTO,
    allFuelTypes: CodeNameDTO[],
    actions: TableActionData<UngroupedDeviceDTO['id']>[],
    handleChecked: (id: UngroupedDeviceDTO['id'], checked: boolean) => void
) => ({
    id: device.id,
    projectName: device.projectName,
    country: Countries.find((country) => country.code === device.countryCode)?.name,
    fuelCode: getFuelNameFromCode(device.fuelCode, allFuelTypes),
    installation: device.installationConfiguration,
    capacity: device.capacityRange,
    age: device.commissioningDateRange,
    offTaker: device.offTaker,
    sector: device.sector,
    standardCompliance: device.standardCompliance,
    actions: actions,
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
    actions: TableActionData<UngroupedDeviceDTO['id']>[],
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
            actions: 'Details',
            checked: ''
        },
        loading,
        pageSize: 25,
        data:
            devices?.map((device) =>
                prepareUngroupedDevicesData(device, allFuelTypes, actions, handleChecked)
            ) ?? []
    };
};
