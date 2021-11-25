import { useUserControllerMe } from '@energyweb/origin-drec-api-client';
import { getAuthenticationToken, removeAuthenticationToken } from 'shared';
import { useNavigate } from 'react-router';
import { useQueryClient } from 'react-query';
import { useCallback, useMemo } from 'react';

export const useUser = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const logout = useCallback(() => {
        const token = getAuthenticationToken();
        if (token) {
            removeAuthenticationToken();
            queryClient.clear();
            navigate('/');
        }
    }, []);
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

    const isAuthenticated = useMemo(
        () => Boolean(tokenExists && isSuccess),
        [tokenExists, isSuccess]
    );

    return {
        user,
        userLoading,
        isAuthenticated,
        logout
    };
};
