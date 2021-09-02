import { EnergyTypeEnum } from '@energyweb/origin-ui-utils';
import { DeviceDTO, CodeNameDTO } from '@energyweb/origin-drec-api-client';
import { getEnergyTypeImage, getMainFuelType } from '../../../utils';

export const useDeviceImagesCarouselEffects = (
    fuelCode: DeviceDTO['fuelCode'],
    allFuelTypes: CodeNameDTO[]
) => {
    const { mainType } = getMainFuelType(fuelCode, allFuelTypes);
    const FallbackIcon = getEnergyTypeImage(mainType.toLowerCase() as EnergyTypeEnum, true);

    return FallbackIcon;
};
