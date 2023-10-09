import { GenericModalProps } from '@energyweb/origin-ui-core';
import { useDeleteDeviceGroupHandler } from '../../../../data';
import { useDeleteDeviceGroupModalLogic } from '../../../../logic';
import {
    useDeviceGroupModalsStore,
    useDeviceGroupModalsDispatch,
    DeviceGroupModalsActionsEnum
} from '../../../context';

export const useDeleteDeviceGroupEffects = () => {
    const {
        deviceGroupDelete: { open, groupId }
    } = useDeviceGroupModalsStore();
    const dispatchModals = useDeviceGroupModalsDispatch();

    const deleteHandler = useDeleteDeviceGroupHandler();
    const deleteGroupHandler = () => {
        dispatchModals({
            type: DeviceGroupModalsActionsEnum.SHOW_DELETE_GROUP,
            payload: { open: false, groupId: null }
        });
        deleteHandler(groupId);
    };

    const closeModal = () => {
        dispatchModals({
            type: DeviceGroupModalsActionsEnum.SHOW_DELETE_GROUP,
            payload: {
                open: false,
                groupId: null
            }
        });
    };
    const { title, text, buttons } = useDeleteDeviceGroupModalLogic(closeModal, deleteGroupHandler);

    const dialogProps: GenericModalProps['dialogProps'] = {
        maxWidth: 'sm'
    };

    return { open, title, text, buttons, dialogProps };
};
