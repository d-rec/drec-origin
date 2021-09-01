import React, { FC, memo } from 'react';

import { GenericForm } from '@energyweb/origin-ui-core';
import { useUpdateUserDataEffects } from './UpdateUserData.effects';
import { UserDTO } from '@energyweb/origin-drec-api-client';
import { Typography } from '@material-ui/core';
import { UserResendConfirmationEmail } from '../UserResendConfirmationEmail';

export interface UpdateUserDataProps {
    userAccountData: UserDTO;
}

export const UpdateUserData: FC<UpdateUserDataProps> = memo(({ userAccountData }) => {
    const { formProps } = useUpdateUserDataEffects(userAccountData);
    return (
        <>
            <Typography variant="h5" gutterBottom>
                User information
            </Typography>
            {userAccountData.email && !userAccountData.emailConfirmed && (
                <UserResendConfirmationEmail />
            )}
            <GenericForm {...formProps} />
        </>
    );
});
