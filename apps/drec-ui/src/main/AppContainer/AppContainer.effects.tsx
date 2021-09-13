import { isRole } from 'utils';
import {
    Role,
    useInvitationControllerGetInvitations,
    UserStatus
} from '@energyweb/origin-drec-api-client';
import { useUser, useAxiosInterceptors } from 'api';
import { getOrganizationMenu, TGetOrganizationMenuArgs } from 'apps/organization';
import { getDeviceMenu, TGetDeviceMenuArgs } from 'apps/device';
import { getAccountMenu, TGetAccountMenuArgs, getAdminMenu, TGetAdminMenuArgs } from 'apps/user';
import { useActiveMenuTab, useTopbarButtonList } from 'shared';

export type RoutesConfig = {
    orgRoutes: Omit<TGetOrganizationMenuArgs, 't' | 'isOpen' | 'showSection'>;
    deviceRoutes: Omit<TGetDeviceMenuArgs, 't' | 'isOpen' | 'showSection'>;
    accountRoutes: Omit<TGetAccountMenuArgs, 't' | 'isOpen' | 'showSection'>;
    adminRoutes: Omit<TGetAdminMenuArgs, 't' | 'isOpen' | 'showSection'>;
};

export const useAppContainerEffects = () => {
    useAxiosInterceptors();

    const { isAuthenticated, user, logout, userLoading } = useUser();

    const topbarButtons = useTopbarButtonList(isAuthenticated, logout);
    const { isOrganizationTabActive, isDeviceTabActive, isAccountTabActive, isAdminTabAcive } =
        useActiveMenuTab();
    const { data: userInvitations, isLoading: areInvitationsLoading } =
        useInvitationControllerGetInvitations({
            enabled: isAuthenticated
        });
    const userHasOrg = Boolean(user?.organization?.id);
    const userIsOrgAdmin = isRole(user?.role, Role.OrganizationAdmin);

    const userIsDeviceManagerOrAdmin = isRole(user?.role, Role.DeviceOwner, Role.OrganizationAdmin);
    const userIsActive = user && user.status === UserStatus.Active;
    const userIsAdminOrSupport = isRole(user?.role, Role.Admin, Role.SupportAgent);
    const userIsOrgAdminOrAdminOrSupport = isRole(
        user?.role,
        Role.OrganizationAdmin,
        Role.Admin,
        Role.SupportAgent
    );
    const orgRoutesConfig: RoutesConfig['orgRoutes'] = {
        showRegisterOrg: !userHasOrg,
        showMyOrg: userHasOrg,
        showMembers: userHasOrg && userIsOrgAdmin,
        showInvitations:
            userHasOrg && userIsOrgAdmin ? true : !!userInvitations && userInvitations.length > 0,
        showInvite: userIsActive && userHasOrg && userIsOrgAdmin,
        showAllOrgs: isAuthenticated && userIsActive && userIsAdminOrSupport
    };
    const orgMenu = getOrganizationMenu({
        isOpen: isOrganizationTabActive,
        showSection: userIsOrgAdminOrAdminOrSupport,
        ...orgRoutesConfig
    });

    const deviceRoutesConfig: RoutesConfig['deviceRoutes'] = {
        showAllDevices: true,
        showMapView: true,
        showMyDevices: userIsActive && userHasOrg && userIsDeviceManagerOrAdmin,
        showRegisterDevice: userIsActive && userHasOrg && userIsDeviceManagerOrAdmin
    };
    const deviceMenu = getDeviceMenu({
        isOpen: isDeviceTabActive,
        showSection: true,
        ...deviceRoutesConfig
    });

    const accountRoutesConfig: RoutesConfig['accountRoutes'] = {
        showUserProfile: isAuthenticated
    };
    const accountMenu = getAccountMenu({
        isOpen: isAccountTabActive,
        showSection: true,
        ...accountRoutesConfig
    });

    const adminRoutesConfig: RoutesConfig['adminRoutes'] = {
        showUsers: userIsAdminOrSupport
    };
    const adminMenu = getAdminMenu({
        isOpen: isAdminTabAcive,
        showSection: userIsAdminOrSupport,
        ...adminRoutesConfig
    });

    const menuSections = [deviceMenu, orgMenu, accountMenu, adminMenu];

    const routesConfig: RoutesConfig = {
        orgRoutes: orgRoutesConfig,
        deviceRoutes: deviceRoutesConfig,
        accountRoutes: accountRoutesConfig,
        adminRoutes: adminRoutesConfig
    };

    const isLoading = userLoading || areInvitationsLoading;

    return {
        topbarButtons,
        isAuthenticated,
        menuSections,
        user,
        isLoading,
        routesConfig
    };
};
