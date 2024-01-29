import { IUserModalsStore, TUserModalsAction } from './types';

export enum UserModalsActionsEnum {
    SHOW_USER_REGISTERED = 'SHOW_USER_REGISTERED',
    SHOW_LOGIN_REGISTER_ORG = 'SHOW_LOGIN_REGISTER_ORG'
}

export const userModalsInitialState: IUserModalsStore = {
    userRegistered: false,
    loginRegisterOrg: false
};

export const userModalsReducer = (
    state = userModalsInitialState,
    action: TUserModalsAction
): IUserModalsStore => {
    switch (action.type) {
        case UserModalsActionsEnum.SHOW_USER_REGISTERED:
            return { ...state, userRegistered: action.payload };

        case UserModalsActionsEnum.SHOW_LOGIN_REGISTER_ORG:
            return { ...state, loginRegisterOrg: action.payload };
    }
};
