import { UserDTO } from '@energyweb/origin-drec-api-client';

export interface IPermissionRule {
    label: string;
    passing: boolean;
}

export interface IPermissionReturnType {
    canAccessPage: boolean;
    requirementsProps: {
        rules: IPermissionRule[];
        title: string;
    };
}

export enum Requirement {
    IsLoggedIn,
    IsActiveUser,
    IsPartOfApprovedOrg,
    HasOrganizationBlockchainAddress
}

export type RequirementList = Requirement[];

export interface TUsePermissions {
    user: UserDTO;
    config?: RequirementList;
}
