import {
    useInvitationControllerGetInvitations,
    useOrganizationControllerGetInvitationsForOrganization,
    useInvitationControllerUpdateInvitation,
    InvitationDTO,
    OrganizationInvitationStatus,
    getInvitationControllerGetInvitationsQueryKey,
    getUserControllerMeQueryKey,
    useUserControllerMe
} from '@energyweb/origin-drec-api-client';
import { useQueryClient } from 'react-query';
import { NotificationTypeEnum, showNotification } from '@energyweb/origin-ui-core';

export const useSentOrgInvitationsData = () => {
    const { data: user, isLoading: userLoading } = useUserControllerMe();

    const { data: invitations, isLoading: invitationsLoading } =
        useOrganizationControllerGetInvitationsForOrganization(user?.organization?.id, {
            enabled: Boolean(user?.organization?.id)
        });

    return { isLoading: userLoading || invitationsLoading, invitations };
};

export const useReceivedInvitationsData = () => {
    const { isLoading, data: invitations } = useInvitationControllerGetInvitations();

    return { isLoading, invitations };
};

export const useReceivedInvitationsActions = (openRoleChangedModal: () => void) => {
    const queryClient = useQueryClient();
    const invitationsKey = getInvitationControllerGetInvitationsQueryKey();
    const userKey = getUserControllerMeQueryKey();

    const { mutate } = useInvitationControllerUpdateInvitation({
        onSettled: () => {
            queryClient.invalidateQueries(invitationsKey);
            queryClient.invalidateQueries(userKey);
        }
    });

    const acceptInvite = (id: InvitationDTO['id']) =>
        mutate(
            {
                id: id.toString(),
                status: OrganizationInvitationStatus.Accepted
            },
            {
                onSuccess: () => {
                    showNotification('Invitation accepted', NotificationTypeEnum.Success);
                    openRoleChangedModal();
                },
                onError: (error: any) => {
                    showNotification(
                        `${'Could not accept invitation'}:
            ${error?.response?.data?.message || ''}
            `,
                        NotificationTypeEnum.Error
                    );
                }
            }
        );

    const rejectInvite = (id: InvitationDTO['id']) =>
        mutate(
            {
                id: id.toString(),
                status: OrganizationInvitationStatus.Rejected
            },
            {
                onSuccess: () => {
                    showNotification('Invitation rejected', NotificationTypeEnum.Success);
                },
                onError: (error: any) => {
                    showNotification(
                        `${'Could not reject invitation'}:
            ${error?.response?.data?.message || ''}
            `,
                        NotificationTypeEnum.Error
                    );
                }
            }
        );

    return { acceptInvite, rejectInvite };
};
