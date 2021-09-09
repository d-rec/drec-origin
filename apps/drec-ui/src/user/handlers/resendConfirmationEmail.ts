import { useUserControllerReSendEmailConfirmation } from '@energyweb/origin-drec-api-client';
import { NotificationTypeEnum, showNotification } from '@energyweb/origin-ui-core';

export const useApiResendConfirmationEmail = () => {
    const { isLoading, error, isError, isSuccess, status, mutate } =
        useUserControllerReSendEmailConfirmation();

    const submitHandler = () => {
        mutate(null, {
            onSuccess: () => {
                showNotification('Confirmation email resent', NotificationTypeEnum.Success);
            },
            onError: (error: any) => {
                showNotification(
                    `Error while trying to resend confirmation email:
          ${error?.response?.data?.message || ''}
          `,
                    NotificationTypeEnum.Error
                );
            }
        });
    };

    return {
        status,
        isLoading,
        isSuccess,
        isError,
        error,
        submitHandler
    };
};
