import React, { FC } from 'react';
import { CarouselControls, CarouselModeEnum } from '../CarouselControls';
import { useDeviceImagesCarouselEffects } from './DeviceImagesCarousel.effects';
import { DeviceDTO, CodeNameDTO } from '@energyweb/origin-drec-api-client';
import { useStyles } from './DeviceImagesCarousel.styles';
import { BlockTintedBottom, ImagesCarousel } from '@energyweb/origin-ui-core';

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
        <ImagesCarousel
            carouselProps={{
                interval: 10000,
                navButtonsAlwaysInvisible: true,
                indicatorContainerProps: {
                    className: classes.indicatorContainer,
                    style: {}
                }
            }}
        >
            {imageUrls.length > 0 ? (
                imageUrls.map((url) => (
                    <BlockTintedBottom key={url}>
                        <img src={url} {...itemProps} alt="Green energy device" />
                        <CarouselControls
                            projectName={projectName}
                            carouselMode={carouselMode}
                            handleModeChange={handleModeChange}
                        />
                    </BlockTintedBottom>
                ))
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
        </ImagesCarousel>
    );
};
