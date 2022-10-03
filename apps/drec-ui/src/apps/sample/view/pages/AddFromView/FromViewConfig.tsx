 import React, { FC } from 'react';
import { useStyles } from './FromViewConfig.style';
 import { Paper } from '@mui/material';
import { GenericForm } from '@energyweb/origin-ui-core';
import { usesamplePageEffects } from './FromViewConfig.effect';

export const AddSampleformValuePage: FC = () => {
   const classes= useStyles();
   const { formConfig } = usesamplePageEffects();
   
    return (
        <Paper className={classes.paper}>
             <GenericForm {...formConfig} />
        </Paper> 
       
    );
};