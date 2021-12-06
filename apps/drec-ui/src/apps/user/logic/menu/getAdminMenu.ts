import { TMenuSection } from '@energyweb/origin-ui-core';

export type TGetAdminMenuArgs = {
    isOpen: boolean;
    showSection: boolean;
    showUsers: boolean;
    showAllOrgs: boolean;
    menuButtonClass?: string;
    selectedMenuItemClass?: string;
};

type TUseAdminMenuFn = (args?: TGetAdminMenuArgs) => TMenuSection;

export const getAdminMenu: TUseAdminMenuFn = ({
    isOpen,
    showSection,
    showAllOrgs,
    showUsers,
    menuButtonClass,
    selectedMenuItemClass
}) => {
    return {
        isOpen,
        sectionTitle: 'Admin',
        rootUrl: 'admin',
        show: showSection,
        menuList: [
            {
                url: 'users',
                label: 'Users',
                show: showUsers
            },
            {
                url: 'organizations',
                label: 'Organizations',
                show: showAllOrgs
            }
        ],
        menuButtonClass,
        selectedMenuItemClass
    };
};
