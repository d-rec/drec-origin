import { UserDTO } from '@energyweb/origin-drec-api-client';
import { TableComponentProps, TableRowData } from '@energyweb/origin-ui-core';

export type TUseMembersTableArgs = {
    users: UserDTO[];
    loading: boolean;
};

export type TFormatOrgMembers = (
    props: Omit<TUseMembersTableArgs, 'loading'>
) => TableRowData<UserDTO['id']>[];

export type TUseMembersTableLogic = (
    props: TUseMembersTableArgs
) => TableComponentProps<UserDTO['id']>;
