import {
    getDeviceControllerGetAllUngroupedQueryKey,
    UngroupedDeviceDTO,
    GroupedDevicesDTO,
    useDeviceGroupControllerCreateOne,
    AddGroupDTO
} from '@energyweb/origin-drec-api-client';
import { useQueryClient } from 'react-query';
import { NotificationTypeEnum, showNotification } from '@energyweb/origin-ui-core';
import { TCreateNewGroupFormValues } from '../logic/modals/types';
import { UseFormReset } from 'react-hook-form';

export const useCreateNewGroup = (group: GroupedDevicesDTO, handleModalClose: () => void) => {
    const { mutate } = useDeviceGroupControllerCreateOne();
    const queryClient = useQueryClient();
    const currentUngroupedDevicesQueryKey = getDeviceControllerGetAllUngroupedQueryKey();

    const submitHandler = (
        values: { groupName: string },
        reset: UseFormReset<TCreateNewGroupFormValues>
    ) => {
        const data: AddGroupDTO = {
            name: values.groupName,
            deviceIds: group.devices.map((device: UngroupedDeviceDTO) => device.id)
        };
        mutate(
            { data },
            {
                onSuccess: () => {
                    queryClient.resetQueries(currentUngroupedDevicesQueryKey);
                    showNotification(
                        'New device group successfully created',
                        NotificationTypeEnum.Success
                    );
                    reset();
                    handleModalClose();
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
