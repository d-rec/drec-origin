import { UserDTO } from '@energyweb/origin-drec-api-client';
import { OrganizationDTO } from '@energyweb/origin-drec-api-client';
import { useNavigate } from 'react-router';
import { Check, PermIdentityOutlined } from '@mui/icons-material';
import { useAllOrganizations, useOrgApproveHandler } from 'apps/organization/data';
import { useAllOrganizationsTableLogic } from '../../../logic';

export const useAllOrganizationsPageEffects = () => {
    const { organizations, organizationsLoading } = useAllOrganizations();
    const navigate = useNavigate();

    const approveHandler = useOrgApproveHandler();

    const actions = [
        {
            icon: <Check />,
            name: 'Approve',
            onClick: (id: OrganizationDTO['id']) => approveHandler(id)
        },
        {
            icon: <PermIdentityOutlined data-cy="edit-user-icon" />,
            name: 'Update',
            onClick: (id: UserDTO['id']) => navigate(`/admin/update-organization/${id}`)
        }
    ];
    const tableProps = useAllOrganizationsTableLogic({
        allOrganizations: organizations as OrganizationDTO[],
        actions,
        isLoading: organizationsLoading
    });

    return tableProps;
};
