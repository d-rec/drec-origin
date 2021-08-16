import {
    userControllerMe,
    getUserControllerMeQueryKey,
    LoginDataDTO,
    useAuthControllerLogin,
    useUserControllerMe,
    UserDTO
} from '@energyweb/origin-drec-api-client';
import { NotificationTypeEnum, showNotification } from '../core';
import {
    getAuthenticationToken,
    removeAuthenticationToken,
    setAuthenticationToken
} from '../shared';
import axios from 'axios';
import { useNavigate } from 'react-router';
import { useQueryClient, UseQueryOptions } from 'react-query';
import { AxiosResponse } from 'axios';

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

                    // if (!user?.organizationId) {
                    //     openRegisterOrgModal();
                    //     return;
                    // }

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
    const userQueryKey = getUserControllerMeQueryKey();
    const navigate = useNavigate();

    const clearUser = () => {
        const token = getAuthenticationToken();
        if (token) {
            removeAuthenticationToken();
            queryClient.removeQueries(userQueryKey);
            navigate('/');
            queryClient.resetQueries();
        }
    };
    console.log('tokenExists: ', Boolean(getAuthenticationToken()));
    const tokenExists = Boolean(getAuthenticationToken());

    const {
        data: user,
        isLoading: userLoading,
        isSuccess
    } = useUserControllerMe({
        enabled: tokenExists
    });

    const logout = () => clearUser();
    const isAuthenticated = user && isSuccess;

    return {
        user,
        userLoading,
        isAuthenticated,
        logout
    };
};
