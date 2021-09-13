import { useOrganizationControllerGetAll } from '@energyweb/origin-drec-api-client';

export const useAllOrganizations = () => {
    const { data: organizations, isLoading: organizationsLoading } =
        useOrganizationControllerGetAll();

    return {
        organizations,
        organizationsLoading
    };
};
