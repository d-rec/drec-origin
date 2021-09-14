import { TMenuSection } from '@energyweb/origin-ui-core';

export type TGetAdminMenuArgs = {
    isOpen: boolean;
    showSection: boolean;
    showUsers: boolean;
    menuButtonClass?: string;
    selectedMenuItemClass?: string;
};

type TUseAdminMenuFn = (args?: TGetAdminMenuArgs) => TMenuSection;

export const getAdminMenu: TUseAdminMenuFn = ({
    isOpen,
    showSection,
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
            }
        ],
        menuButtonClass,
        selectedMenuItemClass
    };
};
