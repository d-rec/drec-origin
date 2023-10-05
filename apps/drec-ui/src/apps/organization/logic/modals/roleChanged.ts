import { Role } from '@energyweb/origin-drec-api-client';
import { RoleDescription, TRoleChangedLogic } from './types';

export const getRoleChangedLogic: TRoleChangedLogic = ({ closeModal, role, orgName }) => {
    const deviceManagerActions = (isMainRole: boolean) => ({
        title: isMainRole
            ? 'As a Device Manager you have permission to:'
            : 'You can also perform all actions of a Device Manager:',
        actions: [
            'Register devices and device groups',
            'Request the issuance of certificates',
            'Configure automated order creation'
        ]
    });

    const orgAdminActions = {
        title: 'As an Organization Admin you have permission to:',
        actions: ['Add or remove members from the organization', 'Give and edit user roles']
    };

    const roleDescriptions: RoleDescription[] =
        role === Role.DeviceOwner
            ? [deviceManagerActions(true)]
            : role === Role.OrganizationAdmin
            ? [orgAdminActions, deviceManagerActions(false)]
            : [];

    return {
        title: `Successfully joined ${orgName}`,
        subtitle: `You have successfully joined ${orgName} organization.`,
        roleDescriptions,
        buttons: [{ label: 'Ok', onClick: closeModal }]
    };
};
