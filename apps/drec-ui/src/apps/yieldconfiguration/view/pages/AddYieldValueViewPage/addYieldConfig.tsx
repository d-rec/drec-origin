import React, { FC } from 'react';
import { useStyles } from './addYieldConfig.style';
import { Paper } from '@mui/material';
import { GenericForm } from '@energyweb/origin-ui-core';
import { useYieldPageEffects } from './addYieldConfig.effect';

export const AddYieldValuePage: FC = () => {
    const classes = useStyles();
    const { formConfig } = useYieldPageEffects();
    return (
        <Paper className={classes.paper}>
            <GenericForm {...formConfig} />
        </Paper>
    );
};