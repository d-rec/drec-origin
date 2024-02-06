import { CodeNameDTO } from '@energyweb/origin-drec-api-client';

export const getFuelNameFromCode = (code: string, allFuelTypes: CodeNameDTO[]) => {
    if (!code || !allFuelTypes) return '';
    return allFuelTypes.find((fuelType: CodeNameDTO) => fuelType.code === code)?.name;
};
