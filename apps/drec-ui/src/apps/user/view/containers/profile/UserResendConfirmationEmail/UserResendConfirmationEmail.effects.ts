import { useApiResendConfirmationEmail } from 'apps/user/data';

export const useUserResendConfirmationEmailEffects = () => {
    const { submitHandler, isLoading } = useApiResendConfirmationEmail();
    return { submitHandler, isLoading };
};
