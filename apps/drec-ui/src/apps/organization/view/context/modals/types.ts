import { UserDTO } from '@energyweb/origin-drec-api-client';
import { OrganizationModalsActionsEnum } from './reducer';

type TChangeMemberRoleState = {
    open: boolean;
    userToUpdate: UserDTO;
};

export interface IOrganizationModalsStore {
    organizationAlreadyExists: boolean;
    registerThankYou: boolean;
    roleChanged: boolean;
    changeMemberOrgRole: TChangeMemberRoleState;
}

interface IShowOrganizationAlreadyExistsAction {
    type: OrganizationModalsActionsEnum.SHOW_ORGANIZATION_ALREADY_EXISTS;
    payload: boolean;
}
interface IShowRegisterThankYouAction {
    type: OrganizationModalsActionsEnum.SHOW_REGISTER_THANK_YOU;
    payload: boolean;
}

interface IShowRoleChangeAction {
    type: OrganizationModalsActionsEnum.SHOW_ROLE_CHANGED;
    payload: boolean;
}

interface IChangeMemberOrgRoleAction {
    type: OrganizationModalsActionsEnum.SHOW_CHANGE_MEMBER_ORG_ROLE;
    payload: TChangeMemberRoleState;
}

export type TOrganizationModalsAction =
    | IShowOrganizationAlreadyExistsAction
    | IShowRegisterThankYouAction
    | IShowRoleChangeAction
    | IChangeMemberOrgRoleAction;
