import {
    getUserControllerMeQueryKey,
    UserDTO,
    UserStatus,
    useUserControllerUpdateOwnProfile
} from '@energyweb/origin-drec-api-client';
import { UseFormReset } from 'react-hook-form';
import { useQueryClient } from 'react-query';
import { NotificationTypeEnum, showNotification } from 'shared';

export type TUpdateUserDataFormValues = {
    firstName: UserDTO['firstName'];
    lastName: UserDTO['lastName'];
    telephone: UserDTO['telephone'];
    status: UserDTO['status'];
    emailConfirmed: string;
};

export const useApiUpdateUserAccountData = () => {
    const { mutate } = useUserControllerUpdateOwnProfile();

    const queryClient = useQueryClient();
    const userQueryKey = getUserControllerMeQueryKey();

    const submitHandler = (
        values: TUpdateUserDataFormValues,
        resetForm: UseFormReset<TUpdateUserDataFormValues>
    ) => {
        const user: UserDTO = queryClient.getQueryData(userQueryKey);
        const { email, status } = user;

        if (status !== UserStatus.Active) {
            showNotification(
                `Only active users can perform this action. Your status is ${user.status}`,
                NotificationTypeEnum.Error
            );
            return;
        }

        mutate(
            { data: { ...values, email } },
            {
                onSuccess: () => {
                    showNotification(
                        'User information updated successfully',
                        NotificationTypeEnum.Success
                    );
                    queryClient.resetQueries(userQueryKey);
                    resetForm();
                },
                onError: (error: any) => {
                    showNotification(
                        `Error while updating user information:
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
