import { Paper, Typography } from '@material-ui/core';
import { useStyles } from './NoUngroupedDevices.styles';

export const NoUngroupedDevices = () => {
    const classes = useStyles();

    const noUngroupedDevicesTitle = 'Currently there aren`t any ungrouped devices';

    return (
        <Paper className={classes.paper}>
            <Typography textAlign="center" variant="h6">
                {noUngroupedDevicesTitle}
            </Typography>
        </Paper>
    );
};
