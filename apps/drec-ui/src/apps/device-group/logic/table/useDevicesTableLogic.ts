import { DeviceDTO } from '@energyweb/origin-drec-api-client';
import { TableComponentProps } from '@energyweb/origin-ui-core';
import { PowerFormatter } from '../../../../utils';

const prepareDevicesData = (device: DeviceDTO) => ({
    id: device.id,
    projectName: device.projectName,
    drecId: device.drecID,
    status: device.status,
    address: device.address,
    installation: device.installationConfiguration,
    capacity: PowerFormatter.formatDisplay(device.capacity, true),
    age: device.commissioningDate,
    offTaker: device.offTaker,
    sector: device.sector,
    standardCompliance: device.standardCompliance
});

export const useDevicesTableLogic = (
    devices: DeviceDTO[],
    loading: boolean
): TableComponentProps<DeviceDTO['id']> => {
    return {
        header: {
            projectName: 'Project name',
            drecId: 'D-REC ID',
            status: 'Status',
            address: 'Address',
            installation: 'Installation',
            capacity: 'Capacity',
            age: 'Age',
            offTaker: 'Offtaker',
            sector: 'Sector',
            standardCompliance: 'Standard Compliance'
        },
        loading,
        pageSize: 25,
        data: devices?.map((device) => prepareDevicesData(device)) ?? []
    };
};
