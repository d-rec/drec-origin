import { FC } from 'react';
import { DisabledFormView } from '@energyweb/origin-ui-core';
import { Box, CircularProgress } from '@mui/material';
import { useOrganizationViewPageEffects } from './OrganizationViewPage.effects';
import { useStyles } from './OrganizationViewPage.styles';

export const OrganizationViewPage: FC = () => {
    const classes = useStyles();

    const { pageLoading, orgFormData } = useOrganizationViewPageEffects();

    if (pageLoading) {
        return <CircularProgress />;
    }

    return (
        <Box>
            <DisabledFormView paperClass={classes.paper} {...orgFormData} />
        </Box>
    );
};
