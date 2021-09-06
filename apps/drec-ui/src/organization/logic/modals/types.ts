import { Role, UserDTO } from '@energyweb/origin-drec-api-client';
import { GenericModalProps, SelectRegularProps } from '@energyweb/origin-ui-core';

type ModalLogicFunctionReturnType = Omit<GenericModalProps, 'open' | 'icon'>;

export type TRegisterThankYouLogic = (closeModal: () => void) => ModalLogicFunctionReturnType;

export type TOrganizationAlreadyExistsLogic = (
    closeModal: () => void
) => ModalLogicFunctionReturnType;

type RoleChangeLogicArgs = {
    closeModal: () => void;
    role: Role;
    orgName: string;
};

export type RoleDescription = {
    title: string;
    actions: string[];
};

export type TRoleChangedLogic = (args: RoleChangeLogicArgs) => Omit<
    GenericModalProps,
    'open' | 'icon' | 'text'
> & {
    subtitle: string;
    roleDescriptions: RoleDescription[];
};

type TChangeMemberRoleArgs = {
    userToUpdate: UserDTO;
    closeModal: () => void;
    changeRoleHandler: () => void;
    buttonDisabled: boolean;
};

export type TChangeMemberRoleLogic = (
    props: TChangeMemberRoleArgs
) => ModalLogicFunctionReturnType & Omit<SelectRegularProps, 'value' | 'onChange'>;
