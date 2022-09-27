import { DeviceDTO } from '@energyweb/origin-drec-api-client';
import { TableActionData, TableComponentProps } from '@energyweb/origin-ui-core';
import { PowerFormatter } from '../../../../utils';

const prepareDevicesData = (
    device: DeviceDTO,
    actions: TableActionData<DeviceDTO['id']>[],
    index: number
) => ({
    id: device.id,
    no: index + 1,
    projectName: device.projectName,
    externalId: device.externalId,
    status: device.status,
    address: device.address,
    //installation: device.installationConfiguration,
    capacity: PowerFormatter.capacityFormatDisplay(device.capacity, true),
    age: device.commissioningDate,
    offTaker: device.offTaker,
    //sector: device.sector,
    //standardCompliance: device.standardCompliance,
    actions: actions
});

export const useDevicesTableLogic = (
    devices: DeviceDTO[],
    actions: TableActionData<DeviceDTO['id']>[],
    loading: boolean
): TableComponentProps<DeviceDTO['id']> => {
    return {
        header: {
            no: 'No',
            projectName: 'Project name',
            externalId: 'External ID',
            status: 'Status',
            address: 'Address',
            installation: 'Installation',
            capacity: 'Capacity',
            age: 'Age',
            offTaker: 'Offtaker',
            sector: 'Sector',
            standardCompliance: 'Standard Compliance',
            actions: 'Details'
        },
        loading,
        pageSize: 25,
        data: devices?.map((device, index) => prepareDevicesData(device, actions, index)) ?? []
    };
};
