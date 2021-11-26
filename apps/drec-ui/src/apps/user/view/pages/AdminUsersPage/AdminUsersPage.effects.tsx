import { UserDTO } from '@energyweb/origin-drec-api-client';
import { PermIdentityOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router';
import { useApiAdminFetchUsers } from 'apps/user/data';
import { useAdminUsersTableLogic } from 'apps/user/logic/admin';

export const useAdminUsersPageEffects = () => {
    const { users, isLoading } = useApiAdminFetchUsers();
    const navigate = useNavigate();

    const actions = [
        {
            icon: <PermIdentityOutlined data-cy="edit-user-icon" />,
            name: 'Update',
            onClick: (id: UserDTO['id']) => navigate(`/admin/update-user/${id}`)
        }
    ];
    const tableProps = useAdminUsersTableLogic(users, actions, isLoading);

    return tableProps;
};
