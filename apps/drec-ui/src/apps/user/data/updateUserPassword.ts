import {
    getUserControllerMeQueryKey,
    UserDTO,
    UserStatus,
    useUserControllerUpdateOwnPassword
} from '@energyweb/origin-drec-api-client';
import { useUser } from 'api';
import { useQueryClient } from 'react-query';
import { NotificationTypeEnum, showNotification } from 'shared';

export type TUpdateUserPasswordFormValues = {
    oldPassword: string;
    newPassword: string;
    newPasswordConfirm: string;
};

export const useApiUpdateUserAccountPassword = () => {
    const { logout } = useUser();
    const queryClient = useQueryClient();
    const userQueryKey = getUserControllerMeQueryKey();

    const { mutate } = useUserControllerUpdateOwnPassword();

    const submitHandler = (values: TUpdateUserPasswordFormValues) => {
        const user: UserDTO = queryClient.getQueryData(userQueryKey);
        const { status } = user;
        if (status !== UserStatus.Active) {
            showNotification(
                `Only active users can perform this action. Your status is ${user.status}`,
                NotificationTypeEnum.Error
            );
            return;
        }
        mutate(
            { data: values },
            {
                onSuccess: () => {
                    showNotification(
                        'User password updated successfully. Please log in using new password',
                        NotificationTypeEnum.Success
                    );
                    logout();
                },
                onError: (error: any) => {
                    showNotification(
                        `Error while updating user password:
              ${error?.response?.data?.message || ''}
              `,
                        NotificationTypeEnum.Error
                    );
                }
            }
        );
    };

    return {
        submitHandler
    };
};
