import { Role } from '@energyweb/origin-drec-api-client';

export const roleNamesMatcherForMembersPage = [
    {
        value: Role.OrganizationAdmin,
        label: 'Organization Admin'
    },
    {
        value: Role.DeviceOwner,
        label: 'Device Manager'
    }
];

export const roleNamesMembersPage = () => [
    {
        value: Role.OrganizationAdmin,
        label: 'Admin'
    },
    {
        value: Role.DeviceOwner,
        label: 'Device Manager'
    }
];

export const roleNamesInvitePage = () => [
    {
        value: Role.DeviceOwner,
        label: 'Device Manager'
    },
    {
        value: Role.OrganizationAdmin,
        label: 'Admin'
    }
];
