import { DeviceOrderBy } from '../../../../utils';

export const useAutoGroupModalLogic = (
    groupRules: DeviceOrderBy[],
    groupsNo: number,
    closeModal: () => void,
    autoGroup: () => void
) => {
    return {
        title: 'All selected ungrouped devices are grouped based on the sorting:',
        text: `${groupRules.map((orderRule: DeviceOrderBy) => orderRule)}`,
        buttons: [
            {
                label: 'Cancel',
                onClick: closeModal
            },
            {
                label: `Create ${groupsNo} New Groups`,
                onClick: autoGroup
            }
        ]
    };
};
