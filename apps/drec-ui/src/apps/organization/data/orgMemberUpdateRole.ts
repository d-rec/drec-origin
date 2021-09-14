import {
    getOrganizationControllerGetAllQueryKey,
    Role,
    useOrganizationControllerChangeMemberRole,
    UserDTO,
    useUserControllerMe
} from '@energyweb/origin-drec-api-client';
import { useQueryClient } from 'react-query';
import { NotificationTypeEnum, showNotification } from 'shared';

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
