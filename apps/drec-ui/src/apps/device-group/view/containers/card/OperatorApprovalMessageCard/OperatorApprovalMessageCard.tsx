import { Button, Paper, Typography } from '@material-ui/core';
import { useStyles } from './OperatorApprovalMessageCard.styles';
import { NavLink } from 'react-router-dom';

export const OperatorApprovalMessageCard = () => {
    const classes = useStyles();

    const noDeviceGroupTitle =
        'Make sure you have Metamask to installed and connected and give operator approval before reserving device-groups';
    const noDeviceGroupDescription = 'This can be done from the profile page';

    return (
        <Paper className={classes.paper}>
            <Typography textAlign="center" variant="h6">
                {noDeviceGroupTitle}
            </Typography>
            <Typography textAlign="center">
                {noDeviceGroupDescription}
                <Button component={NavLink} to={'/account/profile'}>
                    here
                </Button>
            </Typography>
        </Paper>
    );
};
