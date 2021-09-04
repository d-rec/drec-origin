import { InvitationDTO } from '@energyweb/origin-drec-api-client';
import { TableComponentProps } from '@energyweb/origin-ui-core';

const prepareSentInvitation = (invite: InvitationDTO) => ({
    id: invite.id,
    email: invite.email,
    status: invite.status
});

export const useSentInvitationsTableLogic = (
    invitations: InvitationDTO[],
    loading: boolean
): TableComponentProps<InvitationDTO['id']> => {
    return {
        header: {
            email: 'Email',
            status: 'Status'
        },
        loading,
        pageSize: 5,
        totalPages: Math.ceil(invitations?.length / 5),
        tableTitle: 'Sent',
        data: invitations?.map((invite) => prepareSentInvitation(invite)) ?? []
    };
};
