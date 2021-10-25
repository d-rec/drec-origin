import { CodeNameDTO } from '@energyweb/origin-drec-api-client';

export const getFuelNameFromCode = (code: string, allFuelTypes: CodeNameDTO[]) => {
    return allFuelTypes?.find((fuelType: CodeNameDTO) => fuelType.code === code).name;
};
