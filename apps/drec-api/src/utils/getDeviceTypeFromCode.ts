import { IREC_DEVICE_TYPES } from '../models';
import { CodeNameDTO } from '../pods/device/dto';

export const getDeviceTypeFromCode = (code: string): string | undefined => {
  return IREC_DEVICE_TYPES.find(
    (fuelType: CodeNameDTO) => fuelType.code === code,
  )?.name;
};
