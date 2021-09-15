import { TMenuSection } from '@energyweb/origin-ui-core';

export type TGetDeviceMenuArgs = {
    isOpen: boolean;
    showSection: boolean;
    showAllDevices: boolean;
    showMapView: boolean;
    showMyDevices: boolean;
    showRegisterDevice: boolean;
    menuButtonClass?: string;
    selectedMenuItemClass?: string;
};

type TGetDeviceMenu = (args?: TGetDeviceMenuArgs) => TMenuSection;

export const getDeviceMenu: TGetDeviceMenu = ({
    isOpen,
    showSection,
    showAllDevices,
    showMapView,
    showMyDevices,
    showRegisterDevice,
    selectedMenuItemClass,
    menuButtonClass
}) => {
    const menuList = [
        {
            url: 'all',
            label: 'All Devices',
            show: showAllDevices ?? true
        },
        {
            url: 'map',
            label: 'Map View',
            show: showMapView ?? true
        },
        {
            url: 'my',
            label: 'My Devices',
            show: showMyDevices
        }
    ];

    return {
        isOpen,
        sectionTitle: 'Devices',
        show: showSection,
        rootUrl: '/device',
        menuList,
        menuButtonClass,
        selectedMenuItemClass
    };
};
