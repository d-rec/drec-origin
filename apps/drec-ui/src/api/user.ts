import { useUserControllerMe } from '@energyweb/origin-drec-api-client';
import { getAuthenticationToken, removeAuthenticationToken } from 'shared';
import { useNavigate } from 'react-router';
import { useQueryClient } from 'react-query';

export const useUser = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const clearUser = () => {
        const token = getAuthenticationToken();
        if (token) {
            removeAuthenticationToken();
            queryClient.clear();
            navigate('/');
        }
    };
    const tokenExists = Boolean(getAuthenticationToken());

    const {
        data: user,
        isLoading: userLoading,
        isSuccess
    } = useUserControllerMe({
        query: {
            enabled: tokenExists
        }
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
