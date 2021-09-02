import { GenericMap } from '@energyweb/origin-ui-core';
import { DeviceDTO } from '@energyweb/origin-drec-api-client';
import React, { FC } from 'react';
import { useDeviceAppEnv } from '../../../context';
import { CarouselControls, CarouselModeEnum } from '../CarouselControls';

interface DeviceMapCarouselProps {
    device: DeviceDTO;
    carouselMode: CarouselModeEnum;
    handleModeChange: (event: React.MouseEvent<HTMLElement>, mode: CarouselModeEnum) => void;
    itemProps: React.HTMLAttributes<HTMLDivElement>;
    mapContainerClassName?: string;
}

export const DeviceMapCarousel: FC<DeviceMapCarouselProps> = ({
    device,
    itemProps,
    carouselMode,
    handleModeChange,
    mapContainerClassName
}) => {
    const { googleMapsApiKey } = useDeviceAppEnv();
    return (
        <div {...itemProps}>
            <GenericMap
                apiKey={googleMapsApiKey}
                allItems={[device]}
                containerClassName={mapContainerClassName}
                mapProps={{
                    options: {
                        mapTypeControl: false,
                        streetViewControl: false,
                        fullscreenControl: true
                    }
                }}
            />
            <CarouselControls
                projectName={device.projectName}
                carouselMode={carouselMode}
                handleModeChange={handleModeChange}
            />
        </div>
    );
};
