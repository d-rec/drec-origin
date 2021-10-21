import {
    getUserControllerMeQueryKey,
    LoginDataDTO,
    useAuthControllerLogin,
    userControllerMe
} from '@energyweb/origin-drec-api-client';
import { useNavigate } from 'react-router';
import { useQueryClient } from 'react-query';
import { NotificationTypeEnum, setAuthenticationToken, showNotification } from 'shared';

export const useUserLogin = () => {
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
