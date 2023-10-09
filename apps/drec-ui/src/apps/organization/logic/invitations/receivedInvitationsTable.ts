import { TableActionData, TableComponentProps } from '@energyweb/origin-ui-core';
import { InvitationDTO, OrganizationInvitationStatus } from '@energyweb/origin-drec-api-client';

const prepareReceivedInvitation = (
    invite: InvitationDTO,
    actions: TableActionData<InvitationDTO['id']>[]
) => ({
    id: invite.id,
    orgName: invite.organization.name,
    email: invite.email,
    status: invite.status,
    actions:
        OrganizationInvitationStatus[invite.status] === OrganizationInvitationStatus.Pending ||
        OrganizationInvitationStatus[invite.status] === OrganizationInvitationStatus.Viewed
            ? actions
            : undefined
});

export const useReceivedInvitationsTableLogic = (
    invitations: InvitationDTO[],
    actions: TableActionData<InvitationDTO['id']>[],
    loading: boolean
): TableComponentProps<InvitationDTO['id']> => {
    return {
        header: {
            orgName: 'Organization',
            email: 'Email',
            status: 'Status',
            actions: ''
        },
        loading,
        tableTitle: 'Received',
        data: invitations?.map((invite) => prepareReceivedInvitation(invite, actions)) ?? []
    };
};
