import { GenericModalProps, SelectRegularProps } from '@energyweb/origin-ui-core';
import { Role } from '@energyweb/origin-drec-api-client';
import { useEffect, useState } from 'react';
import {
    OrganizationModalsActionsEnum,
    useOrgModalsDispatch,
    useOrgModalsStore
} from '../../../context';
import { roleNamesMembersPage } from '../../../utils';
import { TChangeMemberRoleLogic } from '../../../logic';
import { useOrganizationMemberRoleUpdate } from '../../../../api';

export const useChangeMemberRoleEffects = () => {
    const {
        changeMemberOrgRole: { open, userToUpdate }
    } = useOrgModalsStore();
    const dispatchModals = useOrgModalsDispatch();

    const [role, setRole] = useState<Role>(null);
    useEffect(() => {
        if (userToUpdate?.role) {
            setRole(userToUpdate?.role);
        }
    }, [userToUpdate]);

    const handleRoleChange = useOrganizationMemberRoleUpdate();
    const changeRoleHandler = () => {
        dispatchModals({
            type: OrganizationModalsActionsEnum.SHOW_CHANGE_MEMBER_ORG_ROLE,
            payload: { open: false, userToUpdate: null }
        });
        handleRoleChange(userToUpdate?.id, role);
    };

    const closeModal = () => {
        dispatchModals({
            type: OrganizationModalsActionsEnum.SHOW_CHANGE_MEMBER_ORG_ROLE,
            payload: { open: false, userToUpdate: null }
        });
    };

    const { title, errorExists, errorText, field, buttons } = useChangeMemberRoleLogic({
        userToUpdate,
        changeRoleHandler,
        closeModal,
        buttonDisabled: role === userToUpdate?.role
    });

    const dialogProps: GenericModalProps['dialogProps'] = {
        maxWidth: 'sm'
    };

    const modalProps: GenericModalProps = {
        title,
        buttons,
        open,
        dialogProps
    };

    const selectProps: SelectRegularProps = {
        value: role,
        onChange: (event) => setRole(event.target.value as unknown as Role),
        errorExists,
        errorText,
        field
    };

    return { selectProps, modalProps };
};

export const useChangeMemberRoleLogic: TChangeMemberRoleLogic = ({
    userToUpdate,
    closeModal,
    changeRoleHandler,
    buttonDisabled
}) => {
    return {
        title: userToUpdate
            ? `Change role for ${userToUpdate.firstName}  ${userToUpdate.lastName}`
            : '',
        errorExists: false,
        errorText: '',
        field: {
            name: 'member-change-role-select',
            label: 'New role',
            options: roleNamesMembersPage()
        },
        buttons: [
            {
                label: 'Cancel',
                onClick: closeModal,
                variant: 'text',
                color: 'secondary'
            },
            {
                label: 'Change',
                onClick: changeRoleHandler,
                disabled: buttonDisabled
            }
        ]
    };
};
