import { Box, Button } from '@mui/material';
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
