import {
    useOrganizationControllerGetAll,
    useOrganizationControllerGetOrganizationUsersByCode,
    useOrganizationControllerGetOrganizationById,
    useUserControllerMe,
    useOrganizationControllerUpdate,
    getOrganizationControllerGetAllQueryKey,
    OrganizationDTO,
    OrganizationStatus
} from '@energyweb/origin-drec-api-client';
import { NotificationTypeEnum, showNotification } from '@energyweb/origin-ui-core';
import { useQueryClient } from 'react-query';

export const useAllOrganizations = () => {
    const { data: organizations, isLoading: organizationsLoading } =
        useOrganizationControllerGetAll();

    return {
        organizations,
        organizationsLoading
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
        useOrganizationControllerGetOrganizationById();
    return {
        organization,
        organizationLoading
    };
};

export const useMyOrganizationData = () => {
    const { isLoading: organizationLoading, data: user } = useUserControllerMe();

    const organization = user?.organization;
    return { organizationLoading, organization };
};

export const useOrganizationMembersData = () => {
    const { isLoading: isMembersLoading, data: members } =
        useOrganizationControllerGetOrganizationUsersByCode();

    return { isLoading: isMembersLoading, members };
};

export const useOrgApproveHandler = () => {
    const { mutate } = useOrganizationControllerUpdate();
    const queryClient = useQueryClient();
    const allOrgsQueryKey = getOrganizationControllerGetAllQueryKey();

    return (id: OrganizationDTO['id']) => {
        mutate(
            { id, data: { status: OrganizationStatus.Active } },
            {
                onSuccess: () => {
                    showNotification(
                        'Organization was successfully approved',
                        NotificationTypeEnum.Success
                    );
                    queryClient.invalidateQueries(allOrgsQueryKey);
                },
                onError: (error: any) => {
                    showNotification(
                        `Error while approving organization:
              ${error?.response?.data?.message || ''}
              `,
                        NotificationTypeEnum.Error
                    );
                }
            }
        );
    };
};
