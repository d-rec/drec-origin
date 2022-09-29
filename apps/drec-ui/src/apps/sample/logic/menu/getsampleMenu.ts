import { TMenuSection } from '@energyweb/origin-ui-core';

export type TGetSampleMenuArgs = {
    isOpen: boolean;
    showSection: boolean;
    showaddForm: boolean;
 showTableList: boolean;
    // showGraph: boolean;
    menuButtonClass?: string;
    selectedMenuItemClass?: string;
};

type TUseSampleMenuFn = (args?: TGetSampleMenuArgs) => TMenuSection;

export const getSampleconfigMenu: TUseSampleMenuFn = ({
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
        sectionTitle: 'SampleCongifuration',
        rootUrl: 'sample',
        show: showSection,
        menuList: [
            {
                url: 'form',
                label: 'Add Form',
                show: showaddForm
            },
            {
                url: 'table',
                label: 'Table List',
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