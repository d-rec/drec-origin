import { OrganizationDTO, UserDTO } from '@energyweb/origin-drec-api-client';
import { OrgNavData, UserNavData } from '../../../core';

export const useUserAndOrgData = (
    user: UserDTO,
    organization: OrganizationDTO
): { userData: UserNavData; orgData: OrgNavData } => {
    return {
        userData: {
            username: `${user?.firstName} ${user?.lastName}`
        },
        orgData: {
            orgName: organization?.name
        }
    };
};
