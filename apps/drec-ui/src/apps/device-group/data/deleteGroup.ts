import {
    useDeviceGroupControllerRemove,
    getDeviceGroupControllerGetMyDevicesQueryKey
} from '@energyweb/origin-drec-api-client';
import { NotificationTypeEnum, showNotification } from '@energyweb/origin-ui-core';
import { useQueryClient } from 'react-query';

export const useDeleteDeviceGroupHandler = () => {
    const { mutate } = useDeviceGroupControllerRemove();
    const queryClient = useQueryClient();
    const myDeviceGroupsQueryKey = getDeviceGroupControllerGetMyDevicesQueryKey();

    const deleteHandler = (id: number) => {
        mutate(
            { id },
            {
                onSuccess: (response) => {
                    queryClient.invalidateQueries(myDeviceGroupsQueryKey);
                    showNotification(`Device group deleted`, NotificationTypeEnum.Success);
                },
                onError: (error: any) => {
                    showNotification(
                        `Error while deleting device group:
                            ${error?.response?.data?.message || ''}
                            `,
                        NotificationTypeEnum.Error
                    );
                }
            }
        );
    };
    return deleteHandler;
};
