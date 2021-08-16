import { UserModalsActionsEnum } from './reducer';

export interface IUserModalsStore {
    userRegistered: boolean;
    loginRegisterOrg: boolean;
}

interface IShowUserRegisteredAction {
    type: UserModalsActionsEnum.SHOW_USER_REGISTERED;
    payload: boolean;
}

interface IShowLoginRegisterOrgAction {
    type: UserModalsActionsEnum.SHOW_LOGIN_REGISTER_ORG;
    payload: boolean;
}

export type TUserModalsAction = IShowUserRegisteredAction | IShowLoginRegisterOrgAction;
