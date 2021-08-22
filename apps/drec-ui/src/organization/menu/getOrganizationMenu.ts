import { TMenuSection, TModuleMenuItem } from '@energyweb/origin-ui-core';

type TGetOrganizationMenuArgs = {
    isOpen: boolean;
    showSection: boolean;
    showRegisterOrg: boolean;
    showMyOrg: boolean;
    showMembers: boolean;
    showAllOrgs: boolean;
};

type TGetOrganizationMenu = (args?: TGetOrganizationMenuArgs) => TMenuSection;

export const getOrganizationMenu: TGetOrganizationMenu = ({
    isOpen,
    showSection,
    showRegisterOrg,
    showMyOrg,
    showMembers,
    showAllOrgs
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
        menuList
    };
};
