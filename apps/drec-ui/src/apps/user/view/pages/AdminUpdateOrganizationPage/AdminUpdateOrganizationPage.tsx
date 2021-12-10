import { GenericForm } from '@energyweb/origin-ui-core';
import { CircularProgress, Paper, Box } from '@mui/material';
import { useStyles } from './AdminUpdateOrganizationPage.styles';
import { useAdminUpdateOrganizationPageEffects } from './AdminUpdateOrganizationPage.effects';

export const AdminUpdateOrganizationPage = () => {
    const { formProps, signatoryFormProps, isLoading } = useAdminUpdateOrganizationPageEffects();
    const classes = useStyles();

    if (isLoading) {
        return <CircularProgress />;
    }

    return (
        <Box className={classes.wrapper}>
            <Paper className={classes.paper}>
                <GenericForm {...formProps} />
            </Paper>
            <Paper className={classes.paper}>
                <GenericForm {...signatoryFormProps} />
            </Paper>
        </Box>
    );
};
