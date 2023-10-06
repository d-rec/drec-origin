import {
    SelectableDeviceGroupDTO,
    getDeviceGroupControllerGetUnreservedQueryKey,
    useDeviceGroupControllerReserve,
    ReserveGroupsDTO
} from '@energyweb/origin-drec-api-client';
import { useQueryClient } from 'react-query';
import { NotificationTypeEnum, showNotification } from '@energyweb/origin-ui-core';

export const useReserveSelectedGroups = (
    selected: SelectableDeviceGroupDTO[],
    handleModalClose: () => void
) => {
    const { mutate } = useDeviceGroupControllerReserve();
    const queryClient = useQueryClient();
    const currentUnreservedDeviceGroupsQueryKey = getDeviceGroupControllerGetUnreservedQueryKey();

    const reserveGroupsHandler = () => {
        const data: ReserveGroupsDTO = {
            groupsIds: selected.map((groupedDevice: SelectableDeviceGroupDTO) => groupedDevice.id)
        };
        mutate(
            { data },
            {
                onSuccess: () => {
                    queryClient.resetQueries(currentUnreservedDeviceGroupsQueryKey);
                    showNotification(
                        'Device groups successfully reserved',
                        NotificationTypeEnum.Success
                    );
                    handleModalClose();
                },
                onError: (error: any) => {
                    showNotification(
                        `Error while reserving device groups:
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
