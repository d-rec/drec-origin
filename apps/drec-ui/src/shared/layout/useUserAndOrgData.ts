import { UserDTO } from '@energyweb/origin-drec-api-client';
import { OrgNavData, UserNavData } from '@energyweb/origin-ui-core';
import { UserStatus, OrganizationStatus } from '@energyweb/origin-drec-api-client';

export const useUserAndOrgData = (
    user: UserDTO
): { userData: UserNavData; orgData: OrgNavData } => {
    return {
        userData: {
            username: `${user?.firstName} ${user?.lastName}`,
            userPending: user?.status === UserStatus.Pending
        },
        orgData: {
            orgName: user?.organization?.name,
            orgPending: user?.organization && user.organization.status !== OrganizationStatus.Active
        }
    };
};
