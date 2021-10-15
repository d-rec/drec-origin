import { TMenuSection } from '@energyweb/origin-ui-core';

export type TGetDeviceGroupMenuArgs = {
    isOpen: boolean;
    showSection: boolean;
    showAllDeviceGroups: boolean;
    showMyDeviceGroups: boolean;
    menuButtonClass?: string;
    selectedMenuItemClass?: string;
};

type TGetDeviceGroupMenu = (args: TGetDeviceGroupMenuArgs) => TMenuSection;

export const getDeviceGroupMenu: TGetDeviceGroupMenu = ({
    isOpen,
    showSection,
    showAllDeviceGroups,
    showMyDeviceGroups,
    selectedMenuItemClass,
    menuButtonClass
}) => {
    const menuList = [
        {
            url: 'all',
            label: 'All Device Groups',
            show: showAllDeviceGroups ?? true
        },
        {
            url: 'my',
            label: 'My Device Groups',
            show: showMyDeviceGroups
        }
    ];

    return {
        isOpen,
        sectionTitle: 'Device Groups',
        show: showSection,
        rootUrl: '/device-group',
        menuList,
        menuButtonClass,
        selectedMenuItemClass
    };
};
