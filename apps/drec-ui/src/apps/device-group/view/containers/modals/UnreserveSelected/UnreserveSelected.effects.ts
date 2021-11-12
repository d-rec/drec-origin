import { GenericModalProps } from '@energyweb/origin-ui-core';
import { useUnreserveSelectedGroups } from '../../../../data';
import { useUnreserveSelectedModalLogic } from '../../../../logic';
import {
    useDeviceGroupModalsStore,
    useDeviceGroupModalsDispatch,
    DeviceGroupModalsActionsEnum
} from '../../../context';

export const useUnreserveSelectedEffects = () => {
    const {
        unreserveSelected: { open, selected }
    } = useDeviceGroupModalsStore();
    const dispatchModals = useDeviceGroupModalsDispatch();

    const closeModal = () => {
        dispatchModals({
            type: DeviceGroupModalsActionsEnum.UNRESERVE,
            payload: {
                open: false,
                selected: []
            }
        });
    };

    const unreserveSelectedHandler = useUnreserveSelectedGroups(selected, closeModal);

    const unreserveHandler = () => {
        dispatchModals({
            type: DeviceGroupModalsActionsEnum.UNRESERVE,
            payload: { open: false, selected: [] }
        });
        unreserveSelectedHandler();
    };

    const { text, buttons } = useUnreserveSelectedModalLogic(closeModal, unreserveHandler);

    const dialogProps: GenericModalProps['dialogProps'] = {
        maxWidth: 'sm'
    };

    return { open, text, buttons, dialogProps };
};
