import { TMenuSection } from '@energyweb/origin-ui-core';

export type TGetDeviceGroupMenuArgs = {
    isOpen: boolean;
    showSection: boolean;
    showAllDeviceGroups: boolean;
    showMyDeviceGroups: boolean;
    showUngroupedDevices: boolean;
    menuButtonClass?: string;
    selectedMenuItemClass?: string;
};

type TGetDeviceGroupMenu = (args: TGetDeviceGroupMenuArgs) => TMenuSection;

export const getDeviceGroupMenu: TGetDeviceGroupMenu = ({
    isOpen,
    showSection,
    showAllDeviceGroups,
    showMyDeviceGroups,
    showUngroupedDevices,
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
        },
        {
            url: 'ungrouped',
            label: 'Ungrouped Devices',
            show: showUngroupedDevices
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
