import { TMenuSection, TModuleMenuItem } from '@energyweb/origin-ui-core';

export type TGetOrganizationMenuArgs = {
    isOpen: boolean;
    showSection: boolean;
    showRegisterOrg: boolean;
    showMyOrg: boolean;
    showMembers: boolean;
    showInvitations: boolean;
    showInvite: boolean;
    showAllOrgs: boolean;
    menuButtonClass?: string;
    selectedMenuItemClass?: string;
};

type TGetOrganizationMenu = (args?: TGetOrganizationMenuArgs) => TMenuSection;

export const getOrganizationMenu: TGetOrganizationMenu = ({
    isOpen,
    showSection,
    showRegisterOrg,
    showMyOrg,
    showMembers,
    showInvitations,
    showInvite,
    showAllOrgs,
    menuButtonClass,
    selectedMenuItemClass
}) => {
    const menuList: TModuleMenuItem[] = [
        {
            url: 'register',
            label: 'Register',
            show: showRegisterOrg
        },
        {
            url: 'my',
            label: 'My Organization',
            show: showMyOrg
        },
        {
            url: 'members',
            label: 'Members',
            show: showMembers
        },
        {
            url: 'invitations',
            label: 'Invitations',
            show: showInvitations
        },
        {
            url: 'invite',
            label: 'Invite',
            show: showInvite
        },
        {
            url: 'all',
            label: 'All Organizations',
            show: showAllOrgs
        }
    ];

    return {
        isOpen,
        sectionTitle: 'Organization',
        show: showSection,
        rootUrl: '/organization',
        menuList,
        selectedMenuItemClass,
        menuButtonClass
    };
};
