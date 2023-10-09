import { useUserControllerGet } from '@energyweb/origin-drec-api-client';

export const useAdminGetUser = (id: string) => {
    const { data: user, isLoading } = useUserControllerGet(parseInt(id));

    return { user, isLoading };
};
