import { useCreateNewGroup } from '../../../../data';
import { useCreateNewGroupFormLogic } from '../../../../logic';
import {
    DeviceGroupModalsActionsEnum,
    useDeviceGroupModalsDispatch,
    useDeviceGroupModalsStore
} from '../../../context';

export const useCreateNewGroupEffects = () => {
    const { createNewGroup } = useDeviceGroupModalsStore();

    const dispatchModals = useDeviceGroupModalsDispatch();
    const isOpen = createNewGroup?.open;

    const handleModalClose = () => {
        dispatchModals({
            type: DeviceGroupModalsActionsEnum.CREATE_NEW_GROUP,
            payload: { open: false, group: null }
        });
    };

    const formLogic = useCreateNewGroupFormLogic(handleModalClose, createNewGroup?.group);

    const submitHandler = useCreateNewGroup(createNewGroup.group, handleModalClose);

    const formProps = {
        ...formLogic,
        submitHandler
    };

    return { formProps, isOpen, handleModalClose };
};
