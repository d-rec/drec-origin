import { DeviceDTO, CodeNameDTO } from '@energyweb/origin-drec-api-client';
import React, { FC } from 'react';
import { CarouselModeEnum } from '../CarouselControls';
import { DeviceImagesCarousel } from '../DeviceImagesCarousel';
import { DeviceMapCarousel } from '../DeviceMapCarousel';
import { useDetailViewCarouselEffects } from './DetailViewCarousel.effects';
import { useStyles } from './DetailViewCarousel.styles';

interface DetailViewCarouselProps {
    device: DeviceDTO;
    allFuelTypes: CodeNameDTO[];
}

export const DetailViewCarousel: FC<DetailViewCarouselProps> = ({ device, allFuelTypes }) => {
    const { carouselMode, handleModeChange } = useDetailViewCarouselEffects();
    const classes = useStyles();
    return (
        <>
            {carouselMode === CarouselModeEnum.Photo ? (
                <DeviceImagesCarousel
                    projectName={device.projectName}
                    images={device.images}
                    fuelCode={device.fuelCode}
                    allFuelTypes={allFuelTypes}
                    carouselMode={carouselMode}
                    handleModeChange={handleModeChange}
                    itemProps={{ className: classes.item }}
                />
            ) : (
                <DeviceMapCarousel
                    device={device}
                    carouselMode={carouselMode}
                    handleModeChange={handleModeChange}
                    itemProps={{ className: classes.item }}
                />
            )}
        </>
    );
};
