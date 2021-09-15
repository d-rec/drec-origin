import { TMenuSection } from '@energyweb/origin-ui-core';

export type TGetAccountMenuArgs = {
    isOpen: boolean;
    showSection: boolean;
    showUserProfile: boolean;
    menuButtonClass?: string;
    selectedMenuItemClass?: string;
};

type TGetAccountMenuFn = (args?: TGetAccountMenuArgs) => TMenuSection;

export const getAccountMenu: TGetAccountMenuFn = ({
    isOpen,
    showUserProfile,
    menuButtonClass,
    selectedMenuItemClass
}) => ({
    isOpen,
    sectionTitle: 'Account',
    rootUrl: 'account',
    show: showUserProfile,
    menuList: [
        {
            url: 'profile',
            label: 'User profile',
            show: showUserProfile
        }
    ],
    menuButtonClass,
    selectedMenuItemClass
});
