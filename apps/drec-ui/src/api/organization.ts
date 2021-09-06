import {
    useOrganizationControllerGetAll,
    useOrganizationControllerGetOrganizationUsers,
    useOrganizationControllerGetMyOrganization,
    useOrganizationControllerChangeMemberRole,
    useUserControllerMe,
    useOrganizationControllerUpdate,
    getOrganizationControllerGetAllQueryKey,
    OrganizationDTO,
    OrganizationStatus,
    UserDTO,
    Role
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
    const { data, isLoading: usersLoading } = useOrganizationControllerGetOrganizationUsers();

    return {
        users: data,
        usersLoading
    };
};

export const useOrganization = () => {
    const { data: organization, isLoading: organizationLoading } =
        useOrganizationControllerGetMyOrganization();
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
    const { isLoading, data: members } = useOrganizationControllerGetOrganizationUsers();

    return { isLoading, members };
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

export const useOrganizationMemberRoleUpdate = () => {
    const { mutate } = useOrganizationControllerChangeMemberRole();
    const { data: userUpdating } = useUserControllerMe();

    const queryClient = useQueryClient();
    const membersKey = getOrganizationControllerGetAllQueryKey();

    const updateRoleHandler = (userToUpdateId: UserDTO['id'], newRole: Role) => {
        mutate(
            {
                id: userUpdating.organization.id,
                userId: userToUpdateId,
                data: {
                    role: newRole
                }
            },
            {
                onSuccess: () => {
                    showNotification('Member role updated', NotificationTypeEnum.Success);
                    queryClient.invalidateQueries(membersKey);
                },
                onError: (error: any) => {
                    showNotification(
                        `"Error while changing member role:
              ${error?.response?.data?.message || ''}
              `,
                        NotificationTypeEnum.Error
                    );
                }
            }
        );
    };

    return updateRoleHandler;
};
