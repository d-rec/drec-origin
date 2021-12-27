import { useUserControllerMe } from '@energyweb/origin-drec-api-client';
import { useMemo } from 'react';
import { getAuthenticationToken } from '../../../shared';

export const useUser = () => {
    const tokenExists = Boolean(getAuthenticationToken());

    const {
        data,
        isLoading: userLoading,
        isSuccess
    } = useUserControllerMe({
        query: {
            enabled: tokenExists
        }
    });

    const user = data || null;
    const isAuthenticated = useMemo(
        () => Boolean(tokenExists && isSuccess),
        [tokenExists, isSuccess]
    );

    return {
        user,
        userLoading,
        isAuthenticated
    };
};
