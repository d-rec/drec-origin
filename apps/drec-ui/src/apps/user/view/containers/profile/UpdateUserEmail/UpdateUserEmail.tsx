import { FC, memo } from 'react';
import { Typography } from '@mui/material';
import { GenericForm } from '@energyweb/origin-ui-core';
import { UserDTO } from '@energyweb/origin-drec-api-client';
import { useUpdateUserEmailEffects } from './UpdateUserEmail.effects';

export interface UpdateUserEmailProps {
    userAccountData: UserDTO;
}

export const UpdateUserEmail: FC<UpdateUserEmailProps> = memo(({ userAccountData }) => {
    const { formProps } = useUpdateUserEmailEffects(userAccountData);

    return (
        <>
            <Typography variant="h5">Change email</Typography>
            <GenericForm {...formProps} />
        </>
    );
});
