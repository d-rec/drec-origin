import { InvitationDTO } from '@energyweb/origin-drec-api-client';
import { Check, Clear } from '@mui/icons-material';
import {
    useReceivedInvitationsActions,
    useReceivedInvitationsData,
    useSentOrgInvitationsData
} from 'apps/organization/data';
import {
    useReceivedInvitationsTableLogic,
    useSentInvitationsTableLogic
} from 'apps/organization/logic';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { showNotification } from '../../../../../shared';
import { OrganizationModalsActionsEnum, useOrgModalsDispatch } from '../../context';

export const useInvitationsPageEffects = (redirectToIndex: boolean) => {
    const dispatchModals = useOrgModalsDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        if (redirectToIndex) {
            navigate('/login');
            showNotification('Please log in to view this page');
        }
    }, [redirectToIndex]);

    const { isLoading: isSentLoading, invitations: sentInvitations } = useSentOrgInvitationsData();
    const sentInvitationsTable = useSentInvitationsTableLogic(sentInvitations, isSentLoading);

    const openRoleChangedModal = () => {
        dispatchModals({
            type: OrganizationModalsActionsEnum.SHOW_ROLE_CHANGED,
            payload: true
        });
    };

    const { acceptInvite, rejectInvite, isMutating } =
        useReceivedInvitationsActions(openRoleChangedModal);
    const receivedInvitationsActions = [
        {
            icon: <Check />,
            name: 'Accept',
            onClick: (id: InvitationDTO['id']) => acceptInvite(id),
            loading: isMutating
        },
        {
            icon: <Clear />,
            name: 'Decline',
            onClick: (id: InvitationDTO['id']) => rejectInvite(id),
            loading: isMutating
        }
    ];
    const { isLoading: isReceivedLoading, invitations: receivedInvitations } =
        useReceivedInvitationsData();
    const receivedInvitationsTable = useReceivedInvitationsTableLogic(
        receivedInvitations,
        receivedInvitationsActions,
        isReceivedLoading
    );

    const pageLoading = isSentLoading || isReceivedLoading;

    const showSentTable = sentInvitationsTable.data.length > 0;
    const showReceivedTable = receivedInvitationsTable.data.length > 0;
    const showNoInvitationsText = !showSentTable && !showReceivedTable;
    const noInvitationsText = 'You have no Sent or Received invitations';

    return {
        pageLoading,
        showSentTable,
        showReceivedTable,
        showNoInvitationsText,
        noInvitationsText,
        sentInvitationsTable,
        receivedInvitationsTable
    };
};
