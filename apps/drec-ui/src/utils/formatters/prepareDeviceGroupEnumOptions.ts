import { FormSelectOption } from '@energyweb/origin-ui-core';

export const prepareDeviceGroupEnumOptions = (array: string[]): FormSelectOption[] => {
    const groupOptions = array.map((item) => ({
        value: item,
        label: item
    }));
    return groupOptions;
};
