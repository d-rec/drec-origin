import { IREC_FUEL_TYPES } from '../models';
import { CodeNameDTO } from '../pods/device/dto';

export const getFuelNameFromCode = (code: string): string | undefined => {
  return IREC_FUEL_TYPES.find((fuelType: CodeNameDTO) => fuelType.code === code)
    ?.name;
};
