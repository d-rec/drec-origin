import { Paper, Typography } from '@material-ui/core';
import { useStyles } from './NoDeviceGroupsOwnedCard.styles';

export const NoDeviceGroupsOwnedCard = () => {
    const classes = useStyles();

    const noDeviceGroupTitle = 'Currently you don`t have any device groups';
    const noDeviceGroupDescription =
        'You can add new device groups to D-REC Origin by registering a new one.';

    return (
        <Paper className={classes.paper}>
            <Typography textAlign="center" variant="h6">
                {noDeviceGroupTitle}
            </Typography>
            <Typography textAlign="center">{noDeviceGroupDescription}</Typography>
        </Paper>
    );
};
