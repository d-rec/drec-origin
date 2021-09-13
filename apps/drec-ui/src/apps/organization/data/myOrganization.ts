import { useOrganizationControllerGetMyOrganization } from '@energyweb/origin-drec-api-client';

export const useMyOrganizationData = () => {
    const { data: organization, isLoading: organizationLoading } =
        useOrganizationControllerGetMyOrganization();
    return {
        organization,
        organizationLoading
    };
};
