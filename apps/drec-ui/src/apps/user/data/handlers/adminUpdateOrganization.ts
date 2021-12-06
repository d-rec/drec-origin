import {
    getAdminControllerGetOrganizationByIdQueryKey,
    useAdminControllerUpdateOrganization
} from '@energyweb/origin-drec-api-client';
import { NotificationTypeEnum, showNotification } from '@energyweb/origin-ui-core';
import { useQueryClient } from 'react-query';
import { useNavigate } from 'react-router';
import { TAdminUpdateOrganizationFormValues } from '../../logic';

export const useAdminUpdateOrganization = (id: string) => {
    const { mutate } = useAdminControllerUpdateOrganization();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const idAsNumber = parseInt(id);
    const currentOrganizationQueryKey = getAdminControllerGetOrganizationByIdQueryKey(idAsNumber);

    const submitHandler = (values: TAdminUpdateOrganizationFormValues) => {
        mutate(
            { id: idAsNumber, data: values },
            {
                onSuccess: () => {
                    queryClient.resetQueries(currentOrganizationQueryKey);
                    showNotification(
                        'Organization successfully updated',
                        NotificationTypeEnum.Success
                    );
                    navigate('/admin/organizations');
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
