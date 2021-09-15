import {
    getUserControllerGetQueryKey,
    UpdateUserDTO,
    useAdminControllerUpdateUser
} from '@energyweb/origin-drec-api-client';
import { NotificationTypeEnum, showNotification } from '@energyweb/origin-ui-core';
import { useQueryClient } from 'react-query';
import { useNavigate } from 'react-router';

export const useAdminUpdateUser = (id: string) => {
    const { mutate } = useAdminControllerUpdateUser();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const idAsNumber = parseInt(id);
    const currentUserQueryKey = getUserControllerGetQueryKey(idAsNumber);

    const submitHandler = (values: UpdateUserDTO) => {
        mutate(
            { id: idAsNumber, data: values },
            {
                onSuccess: () => {
                    queryClient.resetQueries(currentUserQueryKey);
                    showNotification('User successfully updated', NotificationTypeEnum.Success);
                    navigate('/admin/users');
                },
                onError: (error: any) => {
                    showNotification(
                        `Error while updating user:
            ${error?.response?.data?.message || ''}
            `,
                        NotificationTypeEnum.Error
                    );
                }
            }
        );
    };

    return submitHandler;
};
