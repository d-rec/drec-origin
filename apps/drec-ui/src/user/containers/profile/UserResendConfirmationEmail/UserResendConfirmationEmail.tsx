import React from 'react';
import { Box, Button } from '@material-ui/core';
import { useUserResendConfirmationEmailEffects } from './UserResendConfirmationEmail.effects';

export const UserResendConfirmationEmail = () => {
    const { submitHandler, isLoading } = useUserResendConfirmationEmailEffects();

    return (
        <Box>
            <Button disabled={isLoading} variant="contained" onClick={submitHandler}>
                Resend confirmation email
            </Button>
        </Box>
    );
};
