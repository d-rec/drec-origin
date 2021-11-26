import { Grid, Paper } from '@mui/material';
import { FC } from 'react';
import { DeviceGroupDTO } from '@energyweb/origin-drec-api-client';
import { SmartMeterChart } from '../SmartMeterChart';
import { useStyles } from './SmartMeterBlock.styles';

interface SmartMeterBlockProps {
    deviceGroup: DeviceGroupDTO;
}

export const SmartMeterBlock: FC<SmartMeterBlockProps> = ({ deviceGroup }) => {
    const classes = useStyles();
    return (
        <Paper className={classes.paper}>
            <Grid container>
                <Grid item className={classes.chartContainer}>
                    <SmartMeterChart meterId={deviceGroup.id} />
                </Grid>
            </Grid>
        </Paper>
    );
};
