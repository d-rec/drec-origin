import React, { FC } from 'react';
import { DeviceDTO, CodeNameDTO } from '@energyweb/origin-drec-api-client';
import { BlockTintedBottom, ImagesCarousel } from '@energyweb/origin-ui-core';
import { CarouselControls, CarouselModeEnum } from '../CarouselControls';
import { useDeviceImagesCarouselEffects } from './DeviceImagesCarousel.effects';
import { useStyles } from './DeviceImagesCarousel.styles';

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
    const { FallbackIcon, imageUrls } = useDeviceImagesCarouselEffects(
        images,
        fuelCode,
        allFuelTypes
    );
    const classes = useStyles();
    return (
        <>
            {imageUrls.length > 0 ? (
                <BlockTintedBottom>
                    <ImagesCarousel images={imageUrls} imagesProps={itemProps} />
                    <CarouselControls
                        projectName={projectName}
                        carouselMode={carouselMode}
                        handleModeChange={handleModeChange}
                    />
                </BlockTintedBottom>
            ) : (
                <BlockTintedBottom>
                    <FallbackIcon {...itemProps} />
                    <CarouselControls
                        projectName={projectName}
                        carouselMode={carouselMode}
                        handleModeChange={handleModeChange}
                    />
                </BlockTintedBottom>
            )}
        </>
    );
};
