import { SpecField, SpecFieldProps } from '@energyweb/origin-ui-core';
import { Button, Typography } from '@material-ui/core';
import { ChevronRight, Delete } from '@material-ui/icons';
import React from 'react';
import { useMyDeviceGroupCardHeaderEffects } from './MyDeviceGroupCardHeader.effects';
import { useStyles } from './MyDeviceGroupCardHeader.styles';

interface MyDeviceGroupCardHeaderProps {
    deviceGroupId: number;
    deviceGroupName: string;
    buttonText: string;
    buttonLink: string;
    deleteButtonText: string;
    specFieldProps: SpecFieldProps[];
}

export const MyDeviceGroupCardHeader: React.FC<MyDeviceGroupCardHeaderProps> = ({
    deviceGroupId,
    deviceGroupName,
    buttonText,
    buttonLink,
    deleteButtonText,
    specFieldProps
}) => {
    const classes = useStyles();

    const { clickHandler, deleteHandler } = useMyDeviceGroupCardHeaderEffects(
        buttonLink,
        deviceGroupId
    );

    return (
        <div className={classes.headerWrapper}>
            <div className={classes.nameBlockWrapper}>
                <Typography variant="h5">{deviceGroupName}</Typography>
                <div>
                    <Button
                        color="inherit"
                        onClick={clickHandler}
                        className={classes.button}
                        classes={{ endIcon: classes.buttonEndIcon }}
                        endIcon={<ChevronRight fontSize="small" />}
                    >
                        {buttonText}
                    </Button>
                    <Button
                        color="inherit"
                        onClick={deleteHandler}
                        className={classes.button}
                        classes={{ endIcon: classes.buttonEndIcon }}
                        endIcon={<Delete color="error" fontSize="small" />}
                    >
                        {deleteButtonText}
                    </Button>
                </div>
            </div>
            <div className={classes.specBlockWrapper}>
                {specFieldProps.map((specProp, index) => (
                    <div key={index} style={{ width: '100%' }}>
                        <SpecField
                            wrapperProps={{ className: classes.specFieldWrapper }}
                            valueProps={{ className: classes.specFieldValue }}
                            {...specProp}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
