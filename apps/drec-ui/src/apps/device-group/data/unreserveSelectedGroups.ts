import {
    SelectableDeviceGroupDTO,
    getDeviceGroupControllerGetReservedQueryKey,
    useDeviceGroupControllerUnreserve,
    ReserveGroupsDTO
} from '@energyweb/origin-drec-api-client';
import { useQueryClient } from 'react-query';
import { NotificationTypeEnum, showNotification } from '@energyweb/origin-ui-core';

export const useUnreserveSelectedGroups = (
    selected: SelectableDeviceGroupDTO[],
    handleModalClose: () => void
) => {
    const { mutate } = useDeviceGroupControllerUnreserve();
    const queryClient = useQueryClient();
    const currentReservedDeviceGroupsQueryKey = getDeviceGroupControllerGetReservedQueryKey();

    const reserveGroupsHandler = () => {
        const data: ReserveGroupsDTO = {
            groupsIds: selected.map((groupedDevice: SelectableDeviceGroupDTO) => groupedDevice.id)
        };
        mutate(
            { data },
            {
                onSuccess: () => {
                    queryClient.resetQueries(currentReservedDeviceGroupsQueryKey);
                    showNotification(
                        'Device groups successfully unreserved',
                        NotificationTypeEnum.Success
                    );
                    handleModalClose();
                },
                onError: (error: any) => {
                    showNotification(
                        `Error while unreserving device groups:
                            ${error?.response?.data?.message || ''}
                            `,
                        NotificationTypeEnum.Error
                    );
                }
            }
        );
    };
    return reserveGroupsHandler;
};
