import { TMenuSection } from '@energyweb/origin-ui-core';

export type TGetDeviceGroupMenuArgs = {
    isOpen: boolean;
    showSection: boolean;
    showAllDeviceGroups: boolean;
    showMyDeviceGroups: boolean;
    showUngroupedDevices: boolean;
    showUnreserved: boolean;
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
    showUnreserved,
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
        },
        {
            url: 'unreserved',
            label: 'Unreserved Device Groups',
            show: showUnreserved
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
