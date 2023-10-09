import { useAdminControllerGetUsers } from '@energyweb/origin-drec-api-client';

export const useApiAdminFetchUsers = () => {
    const {
        isLoading,
        error,
        isError,
        isSuccess,
        status,
        data: users
    } = useAdminControllerGetUsers();

    return {
        status,
        isLoading,
        isSuccess,
        isError,
        error,
        users
    };
};
