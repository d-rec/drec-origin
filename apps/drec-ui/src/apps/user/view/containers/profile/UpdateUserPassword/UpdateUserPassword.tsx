import { FC } from 'react';
import { GenericForm } from '@energyweb/origin-ui-core';
import { useUpdateUserPasswordEffects } from './UpdateUserPassword.effects';
import { Typography } from '@mui/material';

export const UpdateUserPassword: FC = () => {
    const { formProps } = useUpdateUserPasswordEffects();

    return (
        <>
            <Typography variant="h5">Change password</Typography>
            <GenericForm {...formProps} />
        </>
    );
};
