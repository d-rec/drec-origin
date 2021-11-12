import { GenericModalProps } from '@energyweb/origin-ui-core';
import { useReserveSelectedGroups } from '../../../../data';
import { useReserveSelectedModalLogic } from '../../../../logic';
import {
    useDeviceGroupModalsStore,
    useDeviceGroupModalsDispatch,
    DeviceGroupModalsActionsEnum
} from '../../../context';

export const useReserveSelectedEffects = () => {
    const {
        reserveSelected: { open, selected }
    } = useDeviceGroupModalsStore();
    const dispatchModals = useDeviceGroupModalsDispatch();

    const closeModal = () => {
        dispatchModals({
            type: DeviceGroupModalsActionsEnum.RESERVE,
            payload: {
                open: false,
                selected: []
            }
        });
    };

    const reserveSelectedHandler = useReserveSelectedGroups(selected, closeModal);

    const reserveHandler = () => {
        reserveSelectedHandler();
        closeModal();
    };

    const { text, buttons } = useReserveSelectedModalLogic(closeModal, reserveHandler);

    const dialogProps: GenericModalProps['dialogProps'] = {
        maxWidth: 'sm'
    };

    return { open, text, buttons, dialogProps };
};
