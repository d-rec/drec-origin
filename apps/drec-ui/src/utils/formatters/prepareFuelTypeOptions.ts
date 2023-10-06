import { FormSelectOption } from '@energyweb/origin-ui-core';
import { CodeNameDTO } from '@energyweb/origin-drec-api-client';

export const prepareFuelTypeOptions = (fuelTypes: CodeNameDTO[]): FormSelectOption[] => {
    if (!fuelTypes?.length) {
        return [];
    }
    const groupOptions = fuelTypes?.map((fuelType) => ({
        value: fuelType.code,
        label: fuelType.name
    }));

    return groupOptions;
};
