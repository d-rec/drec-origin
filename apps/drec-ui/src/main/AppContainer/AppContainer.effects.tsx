import { useMemo } from 'react';
import {
    Role,
    useInvitationControllerGetInvitations,
    UserStatus
} from '@energyweb/origin-drec-api-client';
import { useUser, useAxiosInterceptors } from 'api';
import { getOrganizationMenu, TGetOrganizationMenuArgs } from 'apps/organization';
import { getDeviceGroupMenu, TGetDeviceGroupMenuArgs } from 'apps/device-group';
import { getAccountMenu, TGetAccountMenuArgs, getAdminMenu, TGetAdminMenuArgs } from 'apps/user';
import { useActiveMenuTab, getTopbarButtonList } from 'shared';
import { getCertificateMenu, TGetCertificateMenuArgs } from 'apps/certificate/logic';
import { isRole } from 'utils';
import { useNavigate } from 'react-router';

export type RoutesConfig = {
    orgRoutes: Omit<TGetOrganizationMenuArgs, 'isOpen' | 'showSection'>;
    deviceGroupRoutes: Omit<TGetDeviceGroupMenuArgs, 'isOpen' | 'showSection'>;
    certificateRoutes: Omit<TGetCertificateMenuArgs, 'isOpen' | 'showSection'>;
    accountRoutes: Omit<TGetAccountMenuArgs, 'isOpen' | 'showSection'>;
    adminRoutes: Omit<TGetAdminMenuArgs, 'isOpen' | 'showSection'>;
};

export const useAppContainerEffects = () => {
    useAxiosInterceptors();

    const { isAuthenticated, user, logout, userLoading } = useUser();
    const navigate = useNavigate();

    const topbarButtons = useMemo(
        () => getTopbarButtonList(isAuthenticated, logout, navigate),
        [isAuthenticated, logout, navigate]
    );
    const {
        isOrganizationTabActive,
        isCertificateTabActive,
        isDeviceGroupTabActive,
        isAccountTabActive,
        isAdminTabAcive
    } = useActiveMenuTab();
    const { data: userInvitations, isLoading: areInvitationsLoading } =
        useInvitationControllerGetInvitations({
            query: { enabled: isAuthenticated }
        });
    const userHasOrg = Boolean(user?.organization?.id);
    const userIsOrgAdmin = isRole(user?.role, Role.OrganizationAdmin);
    const userIsDeviceManagerOrAdmin = isRole(user?.role, Role.DeviceOwner, Role.OrganizationAdmin);
    const userIsActive = user && user.status === UserStatus.Active;
    const userIsAdmin = isRole(user?.role, Role.Admin);
    const userIsOrgAdminOrAdmin = isRole(user?.role, Role.OrganizationAdmin, Role.Admin);
    const userOrgHasBlockchainAccountAttached = Boolean(
        user?.organization?.blockchainAccountAddress
    );
    const userIsBuyer = isRole(user?.role, Role.Buyer);

    const orgRoutesConfig: RoutesConfig['orgRoutes'] = useMemo(
        () => ({
            showRegisterOrg: !userHasOrg,
            showMyOrg: userHasOrg,
            showMembers: userHasOrg && userIsOrgAdmin,
            showInvitations:
                userHasOrg && userIsOrgAdmin
                    ? true
                    : !!userInvitations && userInvitations.length > 0,
            showInvite: userIsActive && userHasOrg && userIsOrgAdmin
        }),
        [userHasOrg, userIsOrgAdmin, userInvitations, userIsActive, userIsAdmin]
    );

    const orgMenu = useMemo(
        () =>
            getOrganizationMenu({
                isOpen: isOrganizationTabActive,
                showSection: userIsOrgAdminOrAdmin,
                ...orgRoutesConfig
            }),
        [isOrganizationTabActive, userIsOrgAdminOrAdmin, orgRoutesConfig]
    );

    const accountRoutesConfig: RoutesConfig['accountRoutes'] = useMemo(
        () => ({
            showUserProfile: isAuthenticated
        }),
        [isAuthenticated]
    );
    const accountMenu = useMemo(
        () =>
            getAccountMenu({
                isOpen: isAccountTabActive,
                showSection: true,
                ...accountRoutesConfig
            }),
        [isAccountTabActive, accountRoutesConfig]
    );

    const adminRoutesConfig: RoutesConfig['adminRoutes'] = useMemo(
        () => ({
            showUsers: userIsAdmin,
            showAllOrgs: isAuthenticated && userIsActive && userIsAdmin
        }),
        [isAuthenticated, userIsActive, userIsAdmin]
    );
    const adminMenu = useMemo(
        () =>
            getAdminMenu({
                isOpen: isAdminTabAcive,
                showSection: userIsAdmin,
                ...adminRoutesConfig
            }),
        [isAdminTabAcive, userIsAdmin, adminRoutesConfig]
    );

    const certificateRoutesConfig: RoutesConfig['certificateRoutes'] = useMemo(
        () => ({
            showBlockchainInbox: userIsActive && userHasOrg && userOrgHasBlockchainAccountAttached,
            showRedemptionReport: userIsActive && userHasOrg && userOrgHasBlockchainAccountAttached
        }),
        [userIsActive, userHasOrg, userOrgHasBlockchainAccountAttached]
    );
    const certificateMenu = useMemo(
        () =>
            getCertificateMenu({
                isOpen: isCertificateTabActive,
                showSection: userIsActive && userHasOrg && userOrgHasBlockchainAccountAttached,
                ...certificateRoutesConfig
            }),
        [
            isCertificateTabActive,
            userIsActive,
            userHasOrg,
            userOrgHasBlockchainAccountAttached,
            userIsAdmin,
            certificateRoutesConfig
        ]
    );

    const deviceGroupRoutesConfig: RoutesConfig['deviceGroupRoutes'] = useMemo(
        () => ({
            showAllDeviceGroups: true,
            showMyDeviceGroups: userIsActive && userHasOrg && userIsDeviceManagerOrAdmin,
            showUngroupedDevices: userIsActive && userHasOrg && userIsDeviceManagerOrAdmin,
            showUnreserved: userIsActive && userHasOrg && userIsBuyer,
            showReserved: userIsActive && userHasOrg && userIsBuyer
        }),
        [userIsActive, userHasOrg, userIsDeviceManagerOrAdmin, userIsBuyer]
    );
    const deviceGroupMenu = useMemo(
        () =>
            getDeviceGroupMenu({
                isOpen: isDeviceGroupTabActive,
                showSection: true,
                ...deviceGroupRoutesConfig
            }),
        [isDeviceGroupTabActive, deviceGroupRoutesConfig]
    );

    const menuSections = useMemo(
        () => [deviceGroupMenu, certificateMenu, orgMenu, accountMenu, adminMenu],
        [deviceGroupMenu, certificateMenu, orgMenu, accountMenu, adminMenu]
    );

    const routesConfig: RoutesConfig = useMemo(
        () => ({
            orgRoutes: orgRoutesConfig,
            deviceGroupRoutes: deviceGroupRoutesConfig,
            certificateRoutes: certificateRoutesConfig,
            accountRoutes: accountRoutesConfig,
            adminRoutes: adminRoutesConfig
        }),
        [
            orgRoutesConfig,
            deviceGroupRoutesConfig,
            certificateRoutesConfig,
            accountRoutesConfig,
            adminRoutesConfig
        ]
    );

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
