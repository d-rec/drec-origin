import { useAdminControllerGetOrganizationById } from '@energyweb/origin-drec-api-client';

export const useAdminGetOrganization = (id: string) => {
    const { data: organization, isLoading } = useAdminControllerGetOrganizationById(parseInt(id));
    return {
        organization,
        isLoading
    };
};
