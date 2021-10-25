import { FormSelectOption } from '@energyweb/origin-ui-core';
import { DeviceOrderBy } from '../enumExports';

export const prepareGroupByOptions = (): FormSelectOption[] => {
    const groupOptions = Object.values(DeviceOrderBy).map((order) => ({
        value: order,
        label: order
    }));

    return groupOptions;
};
