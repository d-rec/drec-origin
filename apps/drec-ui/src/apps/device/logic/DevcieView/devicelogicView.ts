import { DeviceDTO } from '@energyweb/origin-drec-api-client';
import { TableActionData, TableComponentProps } from '@energyweb/origin-ui-core';
import { formatOrganizationBusinessType } from 'utils';

// type TViewLogicReturnType = {
//     yieldFormData: DisabledFormViewProps;
// };

const prepareUsersData = (devices: DeviceDTO, actions: TableActionData<DeviceDTO['id']>[]) => ({
    id: devices.id,
    externalId: devices.externalId,
    status: devices.status,
    projectName: devices.projectName,
    address: devices.address,
});
// type TYieldvalueViewLogic = (yieldvaluedata: YieldConfigDTO) => TViewLogicReturnType;

// export const getYieldValueViewLogic: TYieldvalueViewLogic = (yieldvaluedata) => ({
//     yieldFormData: {
//         heading: 'yield value Of All Country',
//         data: [
//             {
//                 label: 'Country Name',
//                 value: yieldvaluedata.countryName
//             },
//             {
//                 label: 'Yield Value',
//                 value: yieldvaluedata.yieldValue
//             },


//             {
//                 label: 'Status',
//                 value: yieldvaluedata.status
//             }
//         ]
//     }
// });

export const getdeviceViewLogic = (
    device: DeviceDTO[],
    actions: TableActionData<DeviceDTO['id']>[],
    loading: boolean
): TableComponentProps<DeviceDTO['id']> => {
    return {
        header: {
            externalId: 'Name',
            status: 'Status',
            projectName: 'projectName',
            address: 'address',
            actions: ''
        },
        loading,
        pageSize: 25,
        data: device?.map((device) => prepareUsersData(device, actions)) ?? []
    };
};
