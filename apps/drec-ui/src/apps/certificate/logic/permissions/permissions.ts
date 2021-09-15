import { OrganizationStatus, UserStatus } from '@energyweb/origin-drec-api-client';
import {
    TUsePermissions,
    IPermissionRule,
    IPermissionReturnType,
    Requirement,
    RequirementList
} from './types';

export const defaultRequirementList: RequirementList = [
    Requirement.IsLoggedIn,
    Requirement.IsActiveUser,
    Requirement.IsPartOfApprovedOrg,
    Requirement.HasOrganizationBlockchainAddress
];

export const usePermissionsLogic = ({
    user,
    config = defaultRequirementList
}: TUsePermissions): IPermissionReturnType => {
    const predicateList: Record<Requirement, IPermissionRule> = {
        [Requirement.IsLoggedIn]: {
            label: 'You need to be a logged in user.',
            passing: Boolean(user)
        },
        [Requirement.IsActiveUser]: {
            label: 'User has to be approved by the platform admin.',
            passing: user?.status === UserStatus.Active
        },
        [Requirement.IsPartOfApprovedOrg]: {
            label: 'The user should be a part of an approved organization.',
            passing:
                Boolean(user?.organization) &&
                user?.organization?.status === OrganizationStatus.Active
        },
        [Requirement.HasOrganizationBlockchainAddress]: {
            label: 'Your organization has to have a blockchain account attached.',
            passing: Boolean(user?.organization?.blockchainAccountAddress)
        }
    };

    const title = 'To access this page, you need to fulfill following criteria';
    const rules = config.map((requirement) => predicateList[requirement]);
    const canAccessPage = rules.every((r) => r.passing);

    const requirementsProps = {
        rules,
        title
    };

    return {
        canAccessPage,
        requirementsProps
    };
};
