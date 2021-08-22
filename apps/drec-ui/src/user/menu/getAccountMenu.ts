import { TMenuSection } from '@energyweb/origin-ui-core';

interface IAccountMenuFnArgs {
    isOpen: boolean;
    showSection: boolean;
    showUserProfile: boolean;
}

type TGetAccountMenuFn = (args?: IAccountMenuFnArgs) => TMenuSection;

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
