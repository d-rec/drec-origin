import { useApiResendConfirmationEmail } from '../../../../api';

export const useUserResendConfirmationEmailEffects = () => {
    const { submitHandler, isLoading } = useApiResendConfirmationEmail();
    return { submitHandler, isLoading };
};
