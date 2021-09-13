import { TMenuSection } from '@energyweb/origin-ui-core';

export type TGetCertificateMenuArgs = {
    isOpen: boolean;
    showSection: boolean;
    showBlockchainInbox: boolean;
    menuButtonClass?: string;
    selectedMenuItemClass?: string;
};

type TGetCertificateMenu = (args?: TGetCertificateMenuArgs) => TMenuSection;

export const getCertificateMenu: TGetCertificateMenu = ({
    isOpen,
    showSection,
    showBlockchainInbox,
    menuButtonClass,
    selectedMenuItemClass
}) => {
    const menuList = [
        {
            url: 'blockchain-inbox',
            label: 'Blockchain Inbox',
            show: showBlockchainInbox
        }
    ];

    return {
        isOpen,
        sectionTitle: 'Certificate',
        show: showSection,
        rootUrl: '/certificate',
        menuList,
        menuButtonClass,
        selectedMenuItemClass
    };
};
