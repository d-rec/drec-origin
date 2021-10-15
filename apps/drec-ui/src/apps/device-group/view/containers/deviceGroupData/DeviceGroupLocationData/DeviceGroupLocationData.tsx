import { FC } from 'react';
import { Grid, Typography } from '@material-ui/core';
import { IconText } from '@energyweb/origin-ui-core';
import { GermanyFlag } from 'assets';
import { useStyles } from './DeviceGroupLocationData.styles';

export interface DeviceGroupLocationDataProps {
    owner: string;
    location: string;
}

export const DeviceGroupLocationData: FC<DeviceGroupLocationDataProps> = ({ owner, location }) => {
    const classes = useStyles();
    return (
        <div className={classes.wrapper}>
            <Grid container alignItems="center" my={1}>
                <Typography className={classes.owner}>{owner}</Typography>
            </Grid>
            <IconText icon={GermanyFlag} title={location} />
        </div>
    );
};
