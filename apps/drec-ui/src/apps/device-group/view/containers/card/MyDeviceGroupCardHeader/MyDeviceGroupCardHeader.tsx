import { SpecField, SpecFieldProps } from '@energyweb/origin-ui-core';
import { Button, Typography } from '@material-ui/core';
import { ChevronRight } from '@material-ui/icons';
import React from 'react';
import { useMyDeviceGroupCardHeaderEffects } from './MyDeviceGroupCardHeader.effects';
import { useStyles } from './MyDeviceGroupCardHeader.styles';

interface MyDeviceGroupCardHeaderProps {
    deviceGroupName: string;
    buttonText: string;
    buttonLink: string;
    specFieldProps: SpecFieldProps;
}

export const MyDeviceGroupCardHeader: React.FC<MyDeviceGroupCardHeaderProps> = ({
    deviceGroupName,
    buttonText,
    buttonLink,
    specFieldProps
}) => {
    const clickHandler = useMyDeviceGroupCardHeaderEffects(buttonLink);
    const classes = useStyles();

    return (
        <div className={classes.headerWrapper}>
            <div className={classes.nameBlockWrapper}>
                <Typography variant="h5">{deviceGroupName}</Typography>
                <Button
                    color="inherit"
                    onClick={clickHandler}
                    className={classes.button}
                    classes={{ endIcon: classes.buttonEndIcon }}
                    endIcon={<ChevronRight fontSize="small" />}
                >
                    {buttonText}
                </Button>
            </div>
            <div className={classes.specBlockWrapper}>
                <SpecField
                    wrapperProps={{ className: classes.specFieldWrapper }}
                    valueProps={{ className: classes.specFieldValue }}
                    {...specFieldProps}
                />
            </div>
        </div>
    );
};
