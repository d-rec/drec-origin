import { useOrganizationControllerGetOrganizationUsers } from '@energyweb/origin-drec-api-client';

export const useOrganizationMembersData = () => {
    const { isLoading, data: members } = useOrganizationControllerGetOrganizationUsers();

    return { isLoading, members };
};
