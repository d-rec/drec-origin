import { TMenuSection } from '@energyweb/origin-ui-core';

export type TGetDeviceMenuArgs = {
    isOpen: boolean;
    showSection: boolean;
    showaddForm: boolean;
    showTableList: boolean;
    // showGraph: boolean;
    menuButtonClass?: string;
    selectedMenuItemClass?: string;
};

type TUseDeviceMenuFn = (args?: TGetDeviceMenuArgs) => TMenuSection;

export const getDeviceconfigMenu: TUseDeviceMenuFn = ({
    isOpen,
    showSection,
    showaddForm,
    showTableList,
    // showGraph,
    menuButtonClass,
    selectedMenuItemClass
}) => {
    return {
        isOpen,
        sectionTitle: 'Device',
        rootUrl: 'device',
        show: showSection,
        menuList: [
            // {
            //     url: 'form',
            //     label: 'Add Form',
            //     show: showaddForm
            // },
            {
                url: 'list',
                label: 'Organization Devices',
                show: showTableList
            },
            // {
            //     url: 'graph',
            //     label: 'graph view',
            //     show: showGraph
            // }
        ],
        menuButtonClass,
        selectedMenuItemClass
    };
};