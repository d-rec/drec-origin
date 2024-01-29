import { TMenuSection } from '@energyweb/origin-ui-core';

export type TGetCertificateMenuArgs = {
    isOpen: boolean;
    showSection: boolean;
    showRedemptionReport: boolean;
    showBlockchainInbox: boolean;
    menuButtonClass?: string;
    selectedMenuItemClass?: string;
};

type TGetCertificateMenu = (args?: TGetCertificateMenuArgs) => TMenuSection;

export const getCertificateMenu: TGetCertificateMenu = ({
    isOpen,
    showSection,
    showRedemptionReport,
    showBlockchainInbox,
    menuButtonClass,
    selectedMenuItemClass
}) => {
    const menuList = [
        {
            url: 'blockchain-inbox',
            label: 'Blockchain Inbox',
            show: showBlockchainInbox
        },
        {
            url: 'redemption-report',
            label: 'Redemption Report',
            show: showRedemptionReport
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
