import React from 'react';
import { GenericModal } from '@energyweb/origin-ui-core';
import { DraftsOutlined } from '@mui/icons-material';
import { useLoginRegisterOrgEffects } from './LoginRegisterOrg.effects';
import { useStyles } from './LoginRegisterOrg.styles';

export const LoginRegisterOrg: React.FC = () => {
    const classes = useStyles();
    const { open, title, text, buttons, dialogProps } = useLoginRegisterOrgEffects();
    return (
        <GenericModal
            open={open}
            title={title}
            text={text}
            buttons={buttons}
            dialogProps={dialogProps}
            icon={<DraftsOutlined className={classes.icon} />}
        />
    );
};
