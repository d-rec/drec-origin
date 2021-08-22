import React, { FC, memo } from 'react';

import { GenericForm } from '@energyweb/origin-ui-core';
import { useUpdateUserEmailEffects } from './UpdateUserEmail.effects';
import { UserDTO } from '@energyweb/origin-drec-api-client';
import { Typography } from '@material-ui/core';

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
