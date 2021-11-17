import { useAdminControllerGetAllOrganizations } from '@energyweb/origin-drec-api-client';

export const useAllOrganizations = () => {
    const { data: organizations, isLoading: organizationsLoading } =
        useAdminControllerGetAllOrganizations();

    return {
        organizations,
        organizationsLoading
    };
};
