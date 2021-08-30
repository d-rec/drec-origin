import React, { FC } from 'react';
import { CircularProgress, Grid } from '@material-ui/core';
import { useStyles } from './AllDevicesPage.styles';
import { useAllDevicesPageEffects } from './AllDevicesPage.effects';
import { DeviceDTO } from '@energyweb/origin-drec-api-client';

export const AllDevicesPage: FC = () => {
    const { allDevices, isLoading } = useAllDevicesPageEffects();
    const classes = useStyles();

    if (isLoading) {
        return <CircularProgress />;
    }

    return (
        <Grid container spacing={3} className={classes.wrapper}>
            {allDevices?.map((device: DeviceDTO) => (
                <Grid key={`device-${device.id}`} item>
                    <p>{device.projectName}</p>
                    {/* <PublicDeviceCard device={device} allDeviceTypes={allDeviceTypes} /> */}
                </Grid>
            ))}
        </Grid>
    );
};
