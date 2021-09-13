import {
    getUserControllerMeQueryKey,
    UpdateUserProfileDTO,
    UserDTO,
    UserStatus,
    useUserControllerUpdateOwnProfile
} from '@energyweb/origin-drec-api-client';
import { useUser } from 'api';
import { UseFormReset } from 'react-hook-form';
import { useQueryClient } from 'react-query';
import { NotificationTypeEnum, showNotification } from 'shared';

export const useApiUpdateUserAccountEmail = () => {
    const { mutate } = useUserControllerUpdateOwnProfile();
    const { logout } = useUser();

    const queryClient = useQueryClient();
    const userQueryKey = getUserControllerMeQueryKey();

    const submitHandler = (
        values: Pick<UpdateUserProfileDTO, 'email'>,
        resetForm: UseFormReset<Pick<UpdateUserProfileDTO, 'email'>>
    ) => {
        const user: UserDTO = queryClient.getQueryData(userQueryKey);
        const { firstName, lastName, telephone, status } = user;
        const restUserProps = { firstName, lastName, telephone };

        if (status !== UserStatus.Active) {
            showNotification(
                `Only active users can perform this action. Your status is ${user.status}`,
                NotificationTypeEnum.Error
            );
            return;
        }

        return mutate(
            { data: { ...values, ...restUserProps } },
            {
                onSuccess: () => {
                    showNotification(
                        'User email updated successfully. Please log in using new email',
                        NotificationTypeEnum.Success
                    );
                    resetForm();
                    logout();
                },
                onError: (error: any) => {
                    showNotification(
                        `Error while updating user email:
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
