import {
    useInvitationControllerGetInvitations,
    useOrganizationControllerGetInvitationsForOrganization,
    useInvitationControllerUpdateInvitation,
    InvitationDTO,
    OrganizationInvitationStatus,
    getInvitationControllerGetInvitationsQueryKey,
    getUserControllerMeQueryKey
} from '@energyweb/origin-drec-api-client';
import { useQueryClient } from 'react-query';
import { NotificationTypeEnum, showNotification } from '@energyweb/origin-ui-core';
import { getAuthenticationToken } from '../../../shared';
import { useUser } from './user';

export const useSentOrgInvitationsData = () => {
    const { user, userLoading, isAuthenticated } = useUser();

    const { data: invitations, isLoading: invitationsLoading } =
        useOrganizationControllerGetInvitationsForOrganization(user?.organization?.id, {
            query: { enabled: isAuthenticated }
        });

    return { isLoading: userLoading || invitationsLoading, invitations };
};

export const useReceivedInvitationsData = () => {
    const authTokenExists = !!getAuthenticationToken();
    const { isLoading, data: invitations } = useInvitationControllerGetInvitations({
        query: { enabled: authTokenExists }
    });

    return { isLoading, invitations };
};

export const useReceivedInvitationsActions = (openRoleChangedModal: () => void) => {
    const queryClient = useQueryClient();
    const invitationsKey = getInvitationControllerGetInvitationsQueryKey();
    const userKey = getUserControllerMeQueryKey();

    const { mutate, isLoading: isMutating } = useInvitationControllerUpdateInvitation();

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
                    queryClient.invalidateQueries(invitationsKey);
                    queryClient.invalidateQueries(userKey);
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

    return { acceptInvite, rejectInvite, isMutating };
};
