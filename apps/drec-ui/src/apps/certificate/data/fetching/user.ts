import { useUserControllerMe } from '@energyweb/origin-drec-api-client';

export const useApiUser = () => {
    const { data: userData, isLoading } = useUserControllerMe();

    const user = userData || null;

    return {
        user,
        isLoading
    };
};
