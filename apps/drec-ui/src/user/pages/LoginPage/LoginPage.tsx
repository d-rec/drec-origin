import { FC } from 'react';

import { Paper } from '@material-ui/core';
import { GenericForm } from '@energyweb/origin-ui-core';
import { useLogInPageEffects } from './LoginPage.effects';
import { useStyles } from './LoginPage.styles';
import { DrecLogo, DrecBackground } from '../../../assets';

export const LoginPage: FC = () => {
    const classes = useStyles();
    const { formProps } = useLogInPageEffects();

    return (
        <>
            <img className={classes.background} src={DrecBackground} alt="login page background" />
            <Paper className={classes.paper}>
                <DrecLogo />
                <GenericForm {...formProps}></GenericForm>
            </Paper>
        </>
    );
};
