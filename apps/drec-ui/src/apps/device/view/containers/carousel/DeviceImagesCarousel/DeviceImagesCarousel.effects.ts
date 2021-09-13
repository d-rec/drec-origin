import { DeviceDTO, CodeNameDTO } from '@energyweb/origin-drec-api-client';
import { EnergyTypeEnum } from '@energyweb/origin-ui-utils';
import { getEnergyTypeImage, getMainFuelType } from 'utils';
import { useDeviceImageUrls } from 'apps/device/data';

export const useDeviceImagesCarouselEffects = (
    images: DeviceDTO['images'],
    fuelCode: DeviceDTO['fuelCode'],
    allFuelTypes: CodeNameDTO[]
) => {
    const imageUrls = useDeviceImageUrls(images);
    const { mainType } = getMainFuelType(fuelCode, allFuelTypes);
    const FallbackIcon = getEnergyTypeImage(mainType.toLowerCase() as EnergyTypeEnum, true);

    return { FallbackIcon, imageUrls };
};
