import { FC } from 'react';
import { Grid, Typography } from '@mui/material';
import { useStyles } from './DeviceGroupName.styles';

export interface DeviceGroupNameProps {
    name: string;
}

export const DeviceGroupName: FC<DeviceGroupNameProps> = ({ name }) => {
    const classes = useStyles();
    return (
        <div className={classes.wrapper}>
            <Grid container alignItems="center" my={1}>
                <Typography className={classes.name}>
                    Facility name: {name.replaceAll(',', ' ')}
                </Typography>
            </Grid>
        </div>
    );
};
