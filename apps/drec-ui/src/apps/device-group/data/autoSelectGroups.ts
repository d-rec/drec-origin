import {
    AddGroupDTO,
    getDeviceControllerGetAllUngroupedQueryKey,
    GroupedDevicesDTO,
    UngroupedDeviceDTO,
    useDeviceGroupControllerCreateMultiple
} from '@energyweb/origin-drec-api-client';
import { useQueryClient } from 'react-query';
import { NotificationTypeEnum, showNotification } from '@energyweb/origin-ui-core';

export const useAutoSelectedGroups = (
    selected: GroupedDevicesDTO[],
    handleModalClose: () => void
) => {
    const { mutate } = useDeviceGroupControllerCreateMultiple();
    const queryClient = useQueryClient();
    const currentUngroupedDevicesQueryKey = getDeviceControllerGetAllUngroupedQueryKey();

    const autoSelectGroupsHandler = () => {
        const data: AddGroupDTO[] = selected.map((groupedDevice: GroupedDevicesDTO) => ({
            name: groupedDevice.name,
            deviceIds: groupedDevice.devices.map((device: UngroupedDeviceDTO) => device.id)
        }));
        mutate(
            { data },
            {
                onSuccess: () => {
                    queryClient.resetQueries(currentUngroupedDevicesQueryKey);
                    showNotification(
                        'New device groups successfully created',
                        NotificationTypeEnum.Success
                    );
                    handleModalClose();
                },
                onError: (error: any) => {
                    showNotification(
                        `Error while creating device groups:
                            ${error?.response?.data?.message || ''}
                            `,
                        NotificationTypeEnum.Error
                    );
                }
            }
        );
    };
    return autoSelectGroupsHandler;
};
