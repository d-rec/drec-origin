import { TMenuSection } from '../../../core';

interface IGetAdminMenuFnArgs {
    isOpen: boolean;
    showSection: boolean;
    showUsers: boolean;
}

type TUseAdminMenuFn = (args?: IGetAdminMenuFnArgs) => TMenuSection;

export const getAdminMenu: TUseAdminMenuFn = ({ isOpen, showSection, showUsers }) => {
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
        ]
    };
};
