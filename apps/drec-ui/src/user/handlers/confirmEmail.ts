import {
    getUserControllerMeQueryKey,
    UserDTO,
    useUserControllerConfirmToken
} from '@energyweb/origin-drec-api-client';
import { NotificationTypeEnum, showNotification } from '@energyweb/origin-ui-core';
import { useQueryClient } from 'react-query';
import { useNavigate } from 'react-router';
import { EmailConfirmationResponse } from '../../utils';

export const useConfirmEmailHandler = (user: UserDTO) => {
    const navigate = useNavigate();

    const { mutate } = useUserControllerConfirmToken();
    const queryClient = useQueryClient();
    const userQueryKey = getUserControllerMeQueryKey();

    const confirmHandler = (token: string) => {
        mutate(
            { token },
            {
                onSuccess: (response) => {
                    const emailResponse = response as EmailConfirmationResponse;
                    const notificationType =
                        emailResponse === EmailConfirmationResponse.Expired
                            ? NotificationTypeEnum.Warning
                            : emailResponse === EmailConfirmationResponse.AlreadyConfirmed
                            ? NotificationTypeEnum.Info
                            : NotificationTypeEnum.Success;

                    queryClient.invalidateQueries(userQueryKey);
                    showNotification(emailResponse, notificationType);

                    const navigationPath = !user ? '/login' : '/';
                    navigate(navigationPath);
                },
                onError: (error: any) => {
                    showNotification(
                        `Error while confirming email:
          ${error?.response?.data?.message || ''}
          `,
                        NotificationTypeEnum.Error
                    );
                    navigate('/');
                }
            }
        );
    };
    return confirmHandler;
};
