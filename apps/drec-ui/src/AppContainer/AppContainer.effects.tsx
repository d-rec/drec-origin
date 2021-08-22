import { useTopbarButtonList } from '../shared';
import { isRole } from '../utils';
import { Role } from '@energyweb/origin-drec-api-client';
import { useUser, useAxiosInterceptors } from '../api';
import { useActiveMenuTab } from '../shared';
import { getOrganizationMenu } from '../organization';
import { getDeviceMenu } from '../device';
import { getAccountMenu, getAdminMenu } from '../user';

export const useAppContainerEffects = () => {
    useAxiosInterceptors();

    const { isAuthenticated, user, logout, userLoading } = useUser();

    const topbarButtons = useTopbarButtonList(isAuthenticated, logout);
    const { isOrganizationTabActive, isDeviceTabActive, isAccountTabActive, isAdminTabAcive } =
        useActiveMenuTab();

    const userHasOrg = Boolean(user?.organization?.id);
    const userIsDeviceManagerOrAdmin = isRole(user?.role, Role.DeviceOwner, Role.Admin);
    const userIsAdmin = isRole(user?.role, Role.Admin);
    const userIsOrgAdminOrAdminOrSupport = isRole(user?.role, Role.Admin);

    const orgMenu = getOrganizationMenu({
        isOpen: isOrganizationTabActive,
        showSection: userIsOrgAdminOrAdminOrSupport,
        showRegisterOrg: !userHasOrg,
        showMyOrg: userHasOrg,
        showMembers: userHasOrg && userIsAdmin,
        showAllOrgs: isAuthenticated && userIsAdmin
    });
    const deviceMenu = getDeviceMenu({
        isOpen: isDeviceTabActive,
        showSection: true,
        showAllDevices: true,
        showMapView: true,
        showMyDevices: userHasOrg && userIsDeviceManagerOrAdmin,
        showRegisterDevice: userHasOrg && userIsDeviceManagerOrAdmin
    });
    const accountMenu = getAccountMenu({
        isOpen: isAccountTabActive,
        showSection: true,
        showSettings: true,
        showUserProfile: isAuthenticated
    });
    const adminMenu = getAdminMenu({
        isOpen: isAdminTabAcive,
        showSection: userIsAdmin,
        showUsers: userIsAdmin
    });

    const menuSections = [deviceMenu, orgMenu, accountMenu, adminMenu];

    const isLoading = userLoading;

    return {
        topbarButtons,
        isAuthenticated,
        menuSections,
        user,
        isLoading
    };
};
