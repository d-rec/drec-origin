import { GenericModalProps } from '@energyweb/origin-ui-core';
import {
    DeviceGroupModalsActionsEnum,
    useDeviceGroupModalsDispatch,
    useDeviceGroupModalsStore
} from '../../../context';

export const useDeviceDetailsEffects = () => {
    const {
        deviceDetails: { open, details }
    } = useDeviceGroupModalsStore();
    const dispatchModals = useDeviceGroupModalsDispatch();

    const dialogProps: GenericModalProps['dialogProps'] = {
        maxWidth: 'sm'
    };

    const closeModal = () => {
        dispatchModals({
            type: DeviceGroupModalsActionsEnum.SHOW_DEVICE_DETAILS,
            payload: {
                open: false,
                details: null
            }
        });
    };

    const title = 'Device Details';

    const buttons = [
        {
            label: 'Cancel',
            onClick: closeModal
        }
    ];

    return { open, details, dialogProps, title, buttons };
};
