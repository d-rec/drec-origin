import { TMenuSection } from '@energyweb/origin-ui-core';

export type TGetAccountMenuArgs = {
    isOpen: boolean;
    showSection: boolean;
    showUserProfile: boolean;
};

type TGetAccountMenuFn = (args?: TGetAccountMenuArgs) => TMenuSection;

export const getAccountMenu: TGetAccountMenuFn = ({ isOpen, showUserProfile }) => ({
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
    ]
});
