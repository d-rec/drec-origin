import { Grid, Paper } from '@material-ui/core';
import React, { FC } from 'react';
import { SmartMeterChart } from '../SmartMeterChart';
import { useStyles } from './SmartMeterBlock.styles';
import { DeviceDTO } from '@energyweb/origin-drec-api-client';

interface SmartMeterBlockProps {
    device: DeviceDTO;
}

export const SmartMeterBlock: FC<SmartMeterBlockProps> = ({ device }) => {
    const classes = useStyles();
    return (
        <Paper className={classes.paper}>
            <Grid container spacing={4}>
                <Grid item xs={12} md={12}>
                    <SmartMeterChart meterId={device.id} />
                </Grid>
            </Grid>
        </Paper>
    );
};
