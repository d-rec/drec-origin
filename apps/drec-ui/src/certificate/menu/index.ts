import { TMenuSection } from '@energyweb/origin-ui-core';

export type TGetCertificateMenuArgs = {
    isOpen: boolean;
    showSection: boolean;
    showExchangeInbox: boolean;
    showBlockchainInbox: boolean;
    menuButtonClass?: string;
    selectedMenuItemClass?: string;
};

type TGetCertificateMenu = (args?: TGetCertificateMenuArgs) => TMenuSection;

export const getCertificateMenu: TGetCertificateMenu = ({
    isOpen,
    showSection,
    showExchangeInbox,
    showBlockchainInbox,
    menuButtonClass,
    selectedMenuItemClass
}) => {
    const menuList = [
        {
            url: 'exchange-inbox',
            label: 'Exchange Inbox',
            show: showExchangeInbox
        },
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
