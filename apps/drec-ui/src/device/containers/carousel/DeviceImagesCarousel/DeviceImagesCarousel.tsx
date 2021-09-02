import React, { FC } from 'react';
import { CarouselControls, CarouselModeEnum } from '../CarouselControls';
import { useDeviceImagesCarouselEffects } from './DeviceImagesCarousel.effects';
import { DeviceDTO, CodeNameDTO } from '@energyweb/origin-drec-api-client';

export interface DeviceImagesCarouselProps {
    projectName: DeviceDTO['projectName'];
    images: DeviceDTO['images'];
    allFuelTypes: CodeNameDTO[];
    fuelCode: DeviceDTO['fuelCode'];
    itemProps: React.SVGAttributes<HTMLOrSVGElement>;
    carouselMode: CarouselModeEnum;
    handleModeChange: (event: React.MouseEvent<HTMLElement>, mode: CarouselModeEnum) => void;
}

export const DeviceImagesCarousel: FC<DeviceImagesCarouselProps> = ({
    projectName,
    images,
    fuelCode,
    allFuelTypes,
    itemProps,
    carouselMode,
    handleModeChange
}) => {
    const FallbackIcon = useDeviceImagesCarouselEffects(fuelCode, allFuelTypes);

    return (
        <>
            <FallbackIcon {...itemProps} />
            <CarouselControls
                projectName={projectName}
                carouselMode={carouselMode}
                handleModeChange={handleModeChange}
            />
        </>
    );
};
