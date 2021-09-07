import { useUserControllerMe } from '@energyweb/origin-drec-api-client';
import { useNavigate } from 'react-router';
import {
    OrganizationModalsActionsEnum,
    useOrgModalsDispatch,
    useOrgModalsStore
} from '../../../context';
import { getRoleChangedLogic } from '../../../logic';

export const useRoleChangedEffects = () => {
    const navigate = useNavigate();

    const { roleChanged: open } = useOrgModalsStore();
    const dispatchModals = useOrgModalsDispatch();

    const { data: user } = useUserControllerMe();
    const orgName = user?.organization?.name;
    const role = user?.role;

    const closeModal = () => {
        dispatchModals({
            type: OrganizationModalsActionsEnum.SHOW_ROLE_CHANGED,
            payload: false
        });

        if (!user?.organization?.blockchainAccountAddress) {
            dispatchModals({
                type: OrganizationModalsActionsEnum.SHOW_REGISTER_THANK_YOU,
                payload: true
            });
        } else {
            navigate('/organization/my');
        }
    };

    const modalLogic = getRoleChangedLogic({
        closeModal,
        role,
        orgName
    });

    return { open, ...modalLogic };
};
