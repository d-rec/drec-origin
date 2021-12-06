import { GenericForm } from '@energyweb/origin-ui-core';
import { CircularProgress, Paper } from '@mui/material';
import { useStyles } from './AdminUpdateOrganizationPage.styles';
import { useAdminUpdateOrganizationPageEffects } from './AdminUpdateOrganizationPage.effects';

export const AdminUpdateOrganizationPage = () => {
    const { formProps, isLoading } = useAdminUpdateOrganizationPageEffects();
    const classes = useStyles();

    if (isLoading) {
        return <CircularProgress />;
    }

    return (
        <Paper className={classes.paper}>
            <GenericForm {...formProps} />
        </Paper>
    );
};
