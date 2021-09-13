import { Role } from '@energyweb/origin-drec-api-client/dist/js/src';
import { RoleDescription, TRoleChangedLogic } from './types';

export const getRoleChangedLogic: TRoleChangedLogic = ({ closeModal, role, orgName }) => {
    const memberActions = (isMainRole: boolean) => ({
        title: isMainRole
            ? 'As an Organization Member you can:'
            : 'You can also perform all actions that a regular Organization Member can perform:',
        actions: [
            'Place orders on the exchange',
            'Directly buy certificates',
            'Create and buy certificate',
            'Redeem certificates',
            'Withdraw certificates to organization’s own participant account'
        ]
    });

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
        role === Role.OrganizationUser
            ? [memberActions(true)]
            : role === Role.DeviceOwner
            ? [deviceManagerActions(true), memberActions(false)]
            : role === Role.OrganizationAdmin
            ? [orgAdminActions, deviceManagerActions(false), memberActions(false)]
            : [];

    return {
        title: `Successfully joined ${orgName}`,
        subtitle: `You have successfully joined ${orgName} organization.`,
        roleDescriptions,
        buttons: [{ label: 'Ok', onClick: closeModal }]
    };
};
