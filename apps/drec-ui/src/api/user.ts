import {
    userControllerMe,
    getUserControllerMeQueryKey,
    useAuthControllerLogin,
    useUserControllerMe,
    useUserControllerReSendEmailConfirmation,
    useUserControllerUpdateOwnPassword,
    useUserControllerUpdateOwnProfile,
    UserStatus,
    LoginDataDTO,
    UpdateUserProfileDTO,
    UserDTO
} from '@energyweb/origin-drec-api-client';
import { NotificationTypeEnum, showNotification } from '@energyweb/origin-ui-core';
import {
    getAuthenticationToken,
    removeAuthenticationToken,
    setAuthenticationToken
} from '../shared';
import { useNavigate } from 'react-router';
import { useQueryClient, UseQueryOptions } from 'react-query';
import { AxiosResponse } from 'axios';
import { UseFormReset } from 'react-hook-form';

export type TUpdateUserPasswordFormValues = {
    oldPassword: string;
    newPassword: string;
    newPasswordConfirm: string;
};

export type TUpdateUserDataFormValues = {
    firstName: UserDTO['firstName'];
    lastName: UserDTO['lastName'];
    telephone: UserDTO['telephone'];
    status: UserDTO['status'];
};

export const useUserLogin = (openRegisterOrgModal: () => void) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const userQueryKey = getUserControllerMeQueryKey();

    const { mutate } = useAuthControllerLogin();

    return (values: LoginDataDTO) => {
        mutate(
            { data: values },
            {
                onSuccess: async ({ accessToken }) => {
                    setAuthenticationToken(accessToken);
                    const user = await userControllerMe();
                    queryClient.setQueryData(userQueryKey, user);

                    navigate('/');
                },
                onError: () => {
                    showNotification(
                        'Could not log in with supplied credentials',
                        NotificationTypeEnum.Error
                    );
                }
            }
        );
    };
};

export const useUser = (options?: UseQueryOptions<AxiosResponse<UserDTO>, Error>) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const clearUser = () => {
        const token = getAuthenticationToken();
        if (token) {
            removeAuthenticationToken();
            navigate('/');
            queryClient.clear();
        }
    };
    const tokenExists = Boolean(getAuthenticationToken());

    const {
        data: user,
        isLoading: userLoading,
        isSuccess
    } = useUserControllerMe({
        enabled: tokenExists
    });

    const logout = () => clearUser();
    const isAuthenticated = !!(user && isSuccess);

    return {
        user,
        userLoading,
        isAuthenticated,
        logout
    };
};

export const useApiResendConfirmationEmail = () => {
    const { isLoading, error, isError, isSuccess, status, mutateAsync } =
        useUserControllerReSendEmailConfirmation();

    const submitHandler = () => {
        mutateAsync().then(
            () => {
                showNotification('Email was resent', NotificationTypeEnum.Success);
            },
            () => {
                showNotification('Cannot resed email', NotificationTypeEnum.Error);
            }
        );
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
