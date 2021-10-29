import { CodeNameDTO, UnreservedDeviceGroupDTO } from '@energyweb/origin-drec-api-client';
import { TableComponentProps } from '@energyweb/origin-ui-core';
import { Checkbox } from '@material-ui/core';
import { getFuelNameFromCode } from '../../../../utils';

const prepareUnreservedDeviceGroupsData = (
    group: UnreservedDeviceGroupDTO,
    allFuelTypes: CodeNameDTO[],
    handleChecked: (id: UnreservedDeviceGroupDTO['id'], checked: boolean) => void
) => ({
    id: group.id,
    country: group.countryCode,
    organization: group.organization.name,
    fuelCode: getFuelNameFromCode(group.fuelCode, allFuelTypes),
    capacityRange: group.capacityRange,
    installations: group.installationConfigurations.join().replaceAll(',', ', '),
    offTakers: group.offTakers.join().replaceAll(',', ', '),
    sectors: group.sectors.join().replaceAll(',', ', '),
    commissioningDateRange: group.commissioningDateRange.join().replaceAll(',', ', '),
    standardCompliance: group.standardCompliance,
    checked: (
        <Checkbox
            checked={group.selected}
            color="default"
            size="medium"
            onChange={(event) => handleChecked(group.id, event.target.checked)}
        />
    )
});

export const useUnreservedDeviceGroupsTableLogic = (
    groups: UnreservedDeviceGroupDTO[],
    handleChecked: (id: UnreservedDeviceGroupDTO['id'], checked: boolean) => void,
    loading: boolean,
    allFuelTypes: CodeNameDTO[]
): TableComponentProps<UnreservedDeviceGroupDTO['id']> => {
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
            checked: ''
        },
        loading,
        pageSize: 25,
        data:
            groups?.map((group) =>
                prepareUnreservedDeviceGroupsData(group, allFuelTypes, handleChecked)
            ) ?? []
    };
};
