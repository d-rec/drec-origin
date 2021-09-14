import { UserDTO } from '@energyweb/origin-drec-api-client';
import { roleNamesMatcherForMembersPage } from '../../utils';
import { TFormatOrgMembers, TUseMembersTableLogic } from './types';

export const formatOrgMembers: TFormatOrgMembers = ({ users }) => {
    return users?.map((user: UserDTO) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: roleNamesMatcherForMembersPage.filter((roleName) => roleName.value === user.role)[0]
            .label
    }));
};

export const useMembersTableLogic: TUseMembersTableLogic = ({ users, loading }) => {
    return {
        tableTitle: 'Organization members',
        tableTitleProps: { variant: 'h5' },
        header: {
            firstName: 'First name',
            lastName: 'Last name',
            email: 'Email',
            role: 'Role'
        },
        loading: loading,
        data: formatOrgMembers({ users }) ?? []
    };
};
