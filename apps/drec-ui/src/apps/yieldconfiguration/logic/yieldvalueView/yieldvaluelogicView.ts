import { YieldConfigDTO } from '@energyweb/origin-drec-api-client';
import { TableActionData, TableComponentProps } from '@energyweb/origin-ui-core';
import { formatOrganizationBusinessType } from 'utils';

// type TViewLogicReturnType = {
//     yieldFormData: DisabledFormViewProps;
// };

const prepareUsersData = (yieldvalues: YieldConfigDTO, actions: TableActionData<YieldConfigDTO['id']>[]) => ({
    id: yieldvalues.id,
    countryName: yieldvalues.countryName,
    yieldvalue: yieldvalues.yieldValue,
    status: yieldvalues.status,
    actions: actions
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

export const getYieldValueViewLogic = (
    yieldvalues: YieldConfigDTO[],
    actions: TableActionData<YieldConfigDTO['id']>[],
    loading: boolean
): TableComponentProps<YieldConfigDTO['id']> => {
    return {
        header: {
            countryName: 'Country Name',
            yieldvalue: 'Yield Value',

            status: 'Status',
            actions: ''
        },
        loading,
        pageSize: 25,
        data: yieldvalues?.map((yieldvalue) => prepareUsersData(yieldvalue, actions)) ?? []
    };
};
