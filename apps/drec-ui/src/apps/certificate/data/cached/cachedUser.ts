import { getUserControllerMeQueryKey, UserDTO } from '@energyweb/origin-drec-api-client';
import { useQueryClient } from 'react-query';

export const useCachedUser = () => {
    const queryClient = useQueryClient();
    const userQueryKey = getUserControllerMeQueryKey();

    return queryClient.getQueryData<UserDTO>(userQueryKey);
};
