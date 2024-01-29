import { GenericModalProps } from '@energyweb/origin-ui-core';
import { useAutoSelectedGroups } from '../../../../data';
import { useAutoGroupModalLogic } from '../../../../logic';
import {
    useDeviceGroupModalsStore,
    useDeviceGroupModalsDispatch,
    DeviceGroupModalsActionsEnum
} from '../../../context';

export const useAutoGroupSelectedEffects = () => {
    const {
        autoGroupSelected: { open, selected, groupRules }
    } = useDeviceGroupModalsStore();
    const dispatchModals = useDeviceGroupModalsDispatch();

    const closeModal = () => {
        dispatchModals({
            type: DeviceGroupModalsActionsEnum.AUTO_GROUP_SELECTED,
            payload: {
                open: false,
                selected: [],
                groupRules: []
            }
        });
    };

    const autoGroupSelectedHandler = useAutoSelectedGroups(selected, closeModal);

    const autoGroupHandler = () => {
        dispatchModals({
            type: DeviceGroupModalsActionsEnum.AUTO_GROUP_SELECTED,
            payload: { open: false, selected: [], groupRules: [] }
        });
        autoGroupSelectedHandler();
    };

    const { title, text, buttons } = useAutoGroupModalLogic(
        groupRules,
        selected?.length,
        closeModal,
        autoGroupHandler
    );

    const dialogProps: GenericModalProps['dialogProps'] = {
        maxWidth: 'sm'
    };

    return { open, title, text, buttons, dialogProps };
};
