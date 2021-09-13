import { ToggleButton, ToggleButtonGroup, Typography } from '@material-ui/core';
import React, { FC } from 'react';
import { DeviceDTO } from '@energyweb/origin-drec-api-client';
import { useStyles } from './CarouselControls.styles';

export enum CarouselModeEnum {
    Photo = 'photo',
    Map = 'map'
}

export interface CarouselControlsProps {
    projectName: DeviceDTO['projectName'];
    carouselMode: CarouselModeEnum;
    handleModeChange: (event: React.MouseEvent<HTMLElement>, mode: CarouselModeEnum) => void;
}

export const CarouselControls: FC<CarouselControlsProps> = ({
    projectName,
    carouselMode,
    handleModeChange
}) => {
    const classes = useStyles();

    const photoLabel = 'Photo';
    const mapLabel = 'Map';

    return (
        <>
            <ToggleButtonGroup
                exclusive
                value={carouselMode}
                onChange={handleModeChange}
                className={classes.toggleGroup}
            >
                <ToggleButton
                    disableRipple
                    className={classes.toggleButton}
                    value={CarouselModeEnum.Photo}
                >
                    {photoLabel}
                </ToggleButton>
                <ToggleButton
                    disableRipple
                    className={classes.toggleButton}
                    value={CarouselModeEnum.Map}
                >
                    {mapLabel}
                </ToggleButton>
            </ToggleButtonGroup>
            <Typography className={classes.deviceName}>{projectName}</Typography>
        </>
    );
};
