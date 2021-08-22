import React, { FC } from 'react';

import { GenericForm } from '@energyweb/origin-ui-core';
import { useUpdateUserPasswordEffects } from './UpdateUserPassword.effects';
import { Typography } from '@material-ui/core';

export const UpdateUserPassword: FC = () => {
    const { formProps } = useUpdateUserPasswordEffects();

    return (
        <>
            <Typography variant="h5">Change password</Typography>
            <GenericForm {...formProps} />
        </>
    );
};
