import { IOrganizationModalsStore, TOrganizationModalsAction } from './types';

export enum OrganizationModalsActionsEnum {
    SHOW_ORGANIZATION_ALREADY_EXISTS = 'SHOW_ORGANIZATION_ALREADY_EXISTS',
    SHOW_REGISTER_THANK_YOU = 'SHOW_REGISTER_THANK_YOU',
    SHOW_ROLE_CHANGED = 'SHOW_ROLE_CHANGED',
    SHOW_CHANGE_MEMBER_ORG_ROLE = 'SHOW_CHANGE_MEMBER_ORG_ROLE'
}

export const orgModalsInitialState: IOrganizationModalsStore = {
    organizationAlreadyExists: false,
    registerThankYou: false,
    roleChanged: false,
    changeMemberOrgRole: {
        open: false,
        userToUpdate: null
    }
};

export const orgModalsReducer = (
    state = orgModalsInitialState,
    action: TOrganizationModalsAction
): IOrganizationModalsStore => {
    switch (action.type) {
        case OrganizationModalsActionsEnum.SHOW_ORGANIZATION_ALREADY_EXISTS:
            return { ...state, organizationAlreadyExists: action.payload };

        case OrganizationModalsActionsEnum.SHOW_REGISTER_THANK_YOU:
            return { ...state, registerThankYou: action.payload };

        case OrganizationModalsActionsEnum.SHOW_ROLE_CHANGED:
            return { ...state, roleChanged: action.payload };

        case OrganizationModalsActionsEnum.SHOW_CHANGE_MEMBER_ORG_ROLE:
            return { ...state, changeMemberOrgRole: { ...action.payload } };
    }
};
