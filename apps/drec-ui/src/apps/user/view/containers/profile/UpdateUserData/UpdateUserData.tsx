import { FC, memo } from 'react';
import { GenericForm } from '@energyweb/origin-ui-core';
import { UserDTO } from '@energyweb/origin-drec-api-client';
import { Typography } from '@material-ui/core';
import { UserResendConfirmationEmail } from '../UserResendConfirmationEmail';
import { useUpdateUserDataEffects } from './UpdateUserData.effects';

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
