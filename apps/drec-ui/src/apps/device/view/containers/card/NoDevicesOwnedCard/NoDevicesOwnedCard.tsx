import { Paper, Typography, Button, Box } from '@material-ui/core';
import { NavLink } from 'react-router-dom';
import { useStyles } from './NoDevicesOwnedCard.styles';

export const NoDevicesOwnedCard = () => {
    const classes = useStyles();

    const noDeviceTitle = 'Currently you don`t have any devices';
    const noDeviceDescription = 'You can add new devices to D-REC Origin by registering a new one.';
    const registerButtonText = 'Register Device';

    return (
        <Paper className={classes.paper}>
            <Typography textAlign="center" variant="h6">
                {noDeviceTitle}
            </Typography>
            <Typography textAlign="center">{noDeviceDescription}</Typography>
            <Box width="100%" display="flex" justifyContent="center">
                <Button
                    color="primary"
                    variant="contained"
                    className={classes.button}
                    component={NavLink}
                    to={'/device/register'}
                >
                    {registerButtonText}
                </Button>
            </Box>
        </Paper>
    );
};
