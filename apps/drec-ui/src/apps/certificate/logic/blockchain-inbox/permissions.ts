import {
    usePermissionsLogic,
    TUsePermissions,
    IPermissionReturnType,
    RequirementList,
    Requirement
} from '../permissions';

export const useBlockchainInboxPermissionsLogic = (
    props: TUsePermissions
): IPermissionReturnType => {
    const requirementList: RequirementList = [
        Requirement.IsLoggedIn,
        Requirement.IsActiveUser,
        Requirement.IsPartOfApprovedOrg
    ];

    const permissions = usePermissionsLogic({
        ...props,
        config: requirementList
    });

    return {
        ...permissions
    };
};
