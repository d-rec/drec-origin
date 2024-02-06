import { CodeNameDTO, SelectableDeviceGroupDTO } from '@energyweb/origin-drec-api-client';
import { TableActionData, TableComponentProps } from '@energyweb/origin-ui-core';
import { Checkbox } from '@mui/material';
import { getFuelNameFromCode } from '../../../../utils';
import { Countries } from '@energyweb/utils-general';

const prepareSelectableDeviceGroupsData = (
    group: SelectableDeviceGroupDTO,
    allFuelTypes: CodeNameDTO[],
    actions: TableActionData<SelectableDeviceGroupDTO['id']>[],
    handleChecked: (id: SelectableDeviceGroupDTO['id'], checked: boolean) => void
) => ({
    id: group.id,
    country: Countries.find((country) => country.code === group.countryCode)?.name,
    organization: group.organization.name,
    fuelCode: getFuelNameFromCode(group.fuelCode, allFuelTypes),
    capacityRange: group.capacityRange,
    installations: group.installationConfigurations? group.installationConfigurations.join().replaceAll(',', ', '):'',
    offTakers: group.offTakers ? group.offTakers.join().replaceAll(',', ', '): '',
    sectors: group.sectors ? group.sectors.join().replaceAll(',', ', '):'',
    commissioningDateRange: group.commissioningDateRange? group.commissioningDateRange.join().replaceAll(',', ', '):'',
    standardCompliance: group.standardCompliance,
    actions: actions,
    checked: (
        <Checkbox
            checked={group.selected}
            color="default"
            size="medium"
            onChange={(event) => handleChecked(group.id, event.target.checked)}
        />
    )
});

export const useSelectableDeviceGroupsTableLogic = (
    groups: SelectableDeviceGroupDTO[],
    actions: TableActionData<SelectableDeviceGroupDTO['id']>[],
    handleChecked: (id: SelectableDeviceGroupDTO['id'], checked: boolean) => void,
    loading: boolean,
    allFuelTypes: CodeNameDTO[]
): TableComponentProps<SelectableDeviceGroupDTO['id']> => {
    return {
        header: {
            country: 'Country',
            organization: 'Organization',
            fuelCode: 'Fuel Code',
            capacityRange: 'Capacity Range',
            installations: 'Installations',
            offTakers: 'Offtakers',
            sectors: 'Sectors',
            commissioningDateRange: 'Commissioning Date Range',
            standardCompliance: 'Standard Compliance',
            actions: 'Details',
            checked: ''
        },
        loading,
        pageSize: 25,
        data:
            groups?.map((group) =>
                prepareSelectableDeviceGroupsData(group, allFuelTypes, actions, handleChecked)
            ) ?? []
    };
};
