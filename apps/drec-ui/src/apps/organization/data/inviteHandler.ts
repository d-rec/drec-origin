import {
    useOrganizationControllerGetInvitationsForOrganization,
    useInvitationControllerInvite,
    useUserControllerMe,
    InviteDTO
} from '@energyweb/origin-drec-api-client';
import { NotificationTypeEnum, showNotification } from '@energyweb/origin-ui-core';
import { UseFormReset } from 'react-hook-form';

export const useOrganizationInviteHandler = () => {
    const { data: user, isLoading: isUserLoading } = useUserControllerMe();
    const { data: alreadySentInvitations, isLoading: isInvitationsLoading } =
        useOrganizationControllerGetInvitationsForOrganization(user?.organization?.id, {
            query: { enabled: Boolean(user?.organization?.id) }
        });

    const { mutate } = useInvitationControllerInvite({
        mutation: {
            onSuccess: () => {
                showNotification('Invitation sent', NotificationTypeEnum.Success);
            },
            onError: (error: any) => {
                showNotification(
                    `Could not invite user to organization:
        ${error?.response?.data?.message || ''}
        `,
                    NotificationTypeEnum.Error
                );
            }
        }
    });

    const submitHandler = (values: InviteDTO, reset: UseFormReset<InviteDTO>) => {
        const alreadySent = alreadySentInvitations.some(
            (invitation) => invitation.email === values.email
        );
        if (alreadySent) {
            showNotification(
                'You have already sent an invitation for this user',
                NotificationTypeEnum.Info
            );
            return;
        }

        mutate({ data: values });
        reset();
    };

    const apiLoading = isUserLoading || isInvitationsLoading;

    return {
        submitHandler,
        apiLoading
    };
};
