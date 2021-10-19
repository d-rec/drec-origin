import { UserDTO } from '@energyweb/origin-drec-api-client';
import { TableActionData, TableComponentProps } from '@energyweb/origin-ui-core';

const prepareUsersData = (user: UserDTO, actions: TableActionData<UserDTO['id']>[]) => ({
    id: user.id,
    name: `${user.firstName} ${user.lastName}`,
    organization: user.organization?.name,
    email: user.email,
    status: user.status,
    actions: actions
});

export const useAdminUsersTableLogic = (
    users: UserDTO[],
    actions: TableActionData<UserDTO['id']>[],
    loading: boolean
): TableComponentProps<UserDTO['id']> => {
    return {
        header: {
            name: 'Name',
            organization: 'Organization',
            email: 'Email',
            status: 'Status',
            actions: ''
        },
        loading,
        pageSize: 25,
        data: users?.map((user) => prepareUsersData(user, actions)) ?? []
    };
};
