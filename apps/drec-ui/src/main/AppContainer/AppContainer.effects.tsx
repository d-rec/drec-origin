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
import {getSampleconfigMenu,TGetSampleMenuArgs} from 'apps/sample'
import { isRole } from 'utils';
import { useNavigate } from 'react-router';
import {getYieldconfigMenu,TGetYieldMenuArgs} from 'apps/yieldconfiguration';
import {getDeviceconfigMenu,TGetDeviceMenuArgs} from 'apps/device';


export type RoutesConfig = {
    orgRoutes: Omit<TGetOrganizationMenuArgs, 'isOpen' | 'showSection'>;
    deviceGroupRoutes: Omit<TGetDeviceGroupMenuArgs, 'isOpen' | 'showSection'>;
    deviceRoutes: Omit<TGetDeviceMenuArgs, 'isOpen' | 'showSection'>;
    certificateRoutes: Omit<TGetCertificateMenuArgs, 'isOpen' | 'showSection'>;
    accountRoutes: Omit<TGetAccountMenuArgs, 'isOpen' | 'showSection'>;
    adminRoutes: Omit<TGetAdminMenuArgs, 'isOpen' | 'showSection'>;
    yieldRoutes: Omit<TGetYieldMenuArgs, 'isOpen' | 'showSection'>;
    sampleRoutes: Omit<TGetSampleMenuArgs, 'isOpen' | 'showSection'>;
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
        isAdminTabAcive,
        isyieldTabActive,
        issampleTabActive,
        isDeviceTabActive
    } = useActiveMenuTab();
    const { data: userInvitations, isLoading: areInvitationsLoading } =
        useInvitationControllerGetInvitations({
            query: { enabled: isAuthenticated }
        });
    const userHasOrg = Boolean(user?.organization?.id);
    const userIsOrgAdmin = isRole(user?.role, Role.OrganizationAdmin);
    const userIsDeviceManagerOrAdmin = isRole(user?.role, Role.DeviceOwner, Role.OrganizationAdmin);
    const userIsDeviceOwner = isRole(user?.role, Role.DeviceOwner);
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
            showUngroupedDevices: userIsActive && userHasOrg && userIsDeviceOwner,
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
    const yieldRoutesConfig: RoutesConfig['yieldRoutes'] = useMemo(
        () => ({
            showaddyield: userIsAdmin,
            showAllyield:  userIsAdmin
        }),
        [isAuthenticated, userIsActive, userIsAdmin]
    );
    const yieldMenu = useMemo(
        () =>
        getYieldconfigMenu({
                isOpen: isyieldTabActive,
                showSection: userIsAdmin,
                ...yieldRoutesConfig
            }),
        [isyieldTabActive, userIsAdmin, yieldRoutesConfig]
    );
    
    const sampleRoutesConfig: RoutesConfig['sampleRoutes'] = useMemo(
        () => ({
            showaddForm: true , 
            showTableList:true,      
            
        }),
        [isAuthenticated, userIsActive, userIsAdmin]
    );
    const sampleMenu = useMemo(
        () =>
        getSampleconfigMenu({
                isOpen: issampleTabActive,
                showSection: true,
                ...sampleRoutesConfig
            }),
        [issampleTabActive, userIsAdmin, sampleRoutesConfig]
    );


    const deviceRoutesConfig: RoutesConfig['deviceRoutes'] = useMemo(
        () => ({
            showaddForm: true , 
            showTableList:userIsActive && userHasOrg && userIsDeviceManagerOrAdmin,      
            
        }),
        [userIsActive, userHasOrg, userIsDeviceManagerOrAdmin]
    );
    const deviceMenu = useMemo(
        () =>
        getDeviceconfigMenu({
                isOpen: isDeviceTabActive,
                showSection: userIsActive && userHasOrg && userIsDeviceManagerOrAdmin ,
                ...deviceRoutesConfig
            }),
        [isDeviceTabActive, true, sampleRoutesConfig]
    );
    const menuSections = useMemo(
        () => [deviceGroupMenu, certificateMenu, orgMenu, accountMenu, adminMenu,yieldMenu,sampleMenu,deviceMenu],
        [deviceGroupMenu, certificateMenu, orgMenu, accountMenu, adminMenu,yieldMenu,sampleMenu,deviceMenu]
    );

    const routesConfig: RoutesConfig = useMemo(
        () => ({
            orgRoutes: orgRoutesConfig,
            deviceGroupRoutes: deviceGroupRoutesConfig,
            deviceRoutes: deviceRoutesConfig,
            certificateRoutes: certificateRoutesConfig,
            accountRoutes: accountRoutesConfig,
            adminRoutes: adminRoutesConfig,
            yieldRoutes:yieldRoutesConfig,
            sampleRoutes:sampleRoutesConfig
          
        }),
        [
            orgRoutesConfig,
            deviceGroupRoutesConfig,
            deviceRoutesConfig,
            certificateRoutesConfig,
            accountRoutesConfig,
            adminRoutesConfig,
            yieldRoutesConfig,
            sampleRoutesConfig
          
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
