import { DeviceDTO, CodeNameDTO } from '@energyweb/origin-drec-api-client';
import { EnergyTypeEnum } from '@energyweb/origin-ui-utils';
import { useDeviceImageUrls } from '../../../../api';
import { getEnergyTypeImage, getMainFuelType } from '../../../utils';

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
