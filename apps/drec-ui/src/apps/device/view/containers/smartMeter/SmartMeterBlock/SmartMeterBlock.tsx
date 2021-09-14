import { Grid, Paper } from '@material-ui/core';
import { FC } from 'react';
import { DeviceDTO } from '@energyweb/origin-drec-api-client';
import { SmartMeterChart } from '../SmartMeterChart';
import { useStyles } from './SmartMeterBlock.styles';

interface SmartMeterBlockProps {
    device: DeviceDTO;
}

export const SmartMeterBlock: FC<SmartMeterBlockProps> = ({ device }) => {
    const classes = useStyles();
    return (
        <Paper className={classes.paper}>
            <Grid container>
                <Grid item className={classes.chartContainer}>
                    <SmartMeterChart meterId={device.id} />
                </Grid>
            </Grid>
        </Paper>
    );
};
