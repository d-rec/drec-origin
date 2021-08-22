import { TMenuSection } from '@energyweb/origin-ui-core';

interface IAccountMenuFnArgs {
    isOpen: boolean;
    showSection: boolean;
    showSettings: boolean;
    showUserProfile: boolean;
}

type TGetAccountMenuFn = (args?: IAccountMenuFnArgs) => TMenuSection;

export const getAccountMenu: TGetAccountMenuFn = ({ isOpen, showSettings, showUserProfile }) => ({
    isOpen,
    sectionTitle: showUserProfile ? 'Account' : 'Settings',
    rootUrl: 'account',
    show: true,
    menuList: [
        {
            url: 'settings',
            label: 'Settings',
            show: showSettings
        },
        {
            url: 'profile',
            label: 'User profile',
            show: showUserProfile
        }
    ]
});
