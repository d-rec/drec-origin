import React, { FC } from 'react';

import { useStyles } from './LoginPage.styles';
import { Box, Button, Paper, Typography } from '@material-ui/core';
import { GenericForm } from '../../core';
import { useLogInPageEffects } from './LoginPage.effects';
import { DrecLogo, DrecBackground } from '../../assets';

export const LoginPage: FC = () => {
    const classes = useStyles();
    const { formProps, navigateToRegister, navigateToResetPassword } = useLogInPageEffects();

    return (
        <>
            <img className={classes.background} src={DrecBackground} alt="login page background" />
            <Paper className={classes.paper}>
                <DrecLogo />
                <GenericForm {...formProps}>
                    {/* <Box>
                        <Button variant="text" onClick={navigateToResetPassword}>
                            Forgot password?
                        </Button>
                    </Box> */}
                </GenericForm>
                {/* <Box>
                    <Typography>Don't have an account?</Typography>
                    <Button onClick={navigateToRegister}>Register now</Button>
                </Box> */}
            </Paper>
        </>
    );
};
