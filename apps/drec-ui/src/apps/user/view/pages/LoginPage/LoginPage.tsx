import { FC } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { GenericForm, IconLink } from '@energyweb/origin-ui-core';
import { useLogInPageEffects } from './LoginPage.effects';
import { useStyles } from './LoginPage.styles';
import { DrecLogo, DrecBackground } from 'assets';

export const LoginPage: FC = () => {
    const classes = useStyles();
    const { formProps, navigateToRegister } = useLogInPageEffects();

    return (
        <>
            <img className={classes.background} src={DrecBackground} alt="login page background" />
            <Paper className={classes.paper}>
                <IconLink url="/">
                    <DrecLogo />
                </IconLink>
                <GenericForm {...formProps}></GenericForm>
                <Box>
                    <Typography>Don't have an account?</Typography>
                    <Button onClick={navigateToRegister}>Register now</Button>
                </Box>
            </Paper>
        </>
    );
};
