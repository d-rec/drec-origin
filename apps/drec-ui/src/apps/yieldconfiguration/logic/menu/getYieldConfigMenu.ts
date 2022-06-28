import { TMenuSection } from '@energyweb/origin-ui-core';

export type TGetYieldMenuArgs = {
    isOpen: boolean;
    showSection: boolean;
    showaddyield: boolean;
    showAllyield: boolean;
    menuButtonClass?: string;
    selectedMenuItemClass?: string;
};

type TUseYieldMenuFn = (args?: TGetYieldMenuArgs) => TMenuSection;

export const getYieldconfigMenu: TUseYieldMenuFn = ({
    isOpen,
    showSection,
    showAllyield,
    showaddyield,
    menuButtonClass,
    selectedMenuItemClass
}) => {
    return {
        isOpen,
        sectionTitle: 'YieldCongifuration',
        rootUrl: 'yieldvalue',
        show: showSection,
        menuList: [
            {
                url: 'add',
                label: 'Add',
                show: showaddyield
            },
            {
                url: 'all',
                label: 'AllyieldValue',
                show: showAllyield
            }
        ],
        menuButtonClass,
        selectedMenuItemClass
    };
};
