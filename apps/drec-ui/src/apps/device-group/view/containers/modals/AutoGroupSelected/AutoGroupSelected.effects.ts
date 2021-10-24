import { GroupedDevicesDTO } from '@energyweb/origin-drec-api-client';
import { GenericModalProps } from '@energyweb/origin-ui-core';
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

    const autoGroupSelectedHandler = (selected: any) => {
        console.log('CALL API AUTO GROUP SELECTED: ', selected);
    };

    const autoGroupHandler = () => {
        dispatchModals({
            type: DeviceGroupModalsActionsEnum.AUTO_GROUP_SELECTED,
            payload: { open: false, selected: [], groupRules: [] }
        });
        autoGroupSelectedHandler(selected);
    };

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
