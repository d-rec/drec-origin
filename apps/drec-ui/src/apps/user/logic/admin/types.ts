import { OrganizationDTO } from '@energyweb/origin-drec-api-client';
import { TableActionData, TableComponentProps, TableRowData } from '@energyweb/origin-ui-core';

export type TUseAllOrganizationsTableArgs = {
    allOrganizations: OrganizationDTO[];
    actions: TableActionData<OrganizationDTO['id']>[];
    isLoading: boolean;
};

export type TFormatAllOrgs = (
    props: Omit<TUseAllOrganizationsTableArgs, 'isLoading'>
) => TableRowData<OrganizationDTO['id']>[];

export type TUseAllOrganizationsTableLogic = (
    props: TUseAllOrganizationsTableArgs
) => TableComponentProps<OrganizationDTO['id']>;
