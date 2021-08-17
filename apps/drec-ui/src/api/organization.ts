import {
    OrganizationDTO,
    useOrganizationControllerGetAll,
    useOrganizationControllerGetOrganizationUsersByCode,
    useOrganizationControllerGetOrganizationByCode
} from '@energyweb/origin-drec-api-client';
import { keyBy } from 'lodash';

export const useAllOrganizations = () => {
    const { data, isLoading: organizationsLoading } = useOrganizationControllerGetAll();

    const organizations = data as OrganizationDTO[];
    const organizationById = keyBy(organizations, 'code');
    const hasOrganizations = organizations.length > 0;

    return {
        organizations,
        organizationsLoading,
        organizationById,
        hasOrganizations
    };
};

export const useOrganizationUsers = () => {
    const { data, isLoading: usersLoading } = useOrganizationControllerGetOrganizationUsersByCode();

    return {
        users: data,
        usersLoading
    };
};

export const useOrganization = () => {
    const { data: organization, isLoading: organizationLoading } =
        useOrganizationControllerGetOrganizationByCode();
    return {
        organization,
        organizationLoading
    };
};
