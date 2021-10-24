import { GroupedDevicesDTO } from '@energyweb/origin-drec-api-client';
import { GenericModalProps } from '@energyweb/origin-ui-core';
import { useEffect, useState } from 'react';
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

    // const [newGroupName, setNewGroupName] = useState<string>(null);
    // useEffect(() => {
    //     if (group?.name) {
    //         setNewGroupName(newGroupName);
    //     }
    // }, [group]);

    // const createNewGroupHandler = () => {
    //     dispatchModals({
    //         type: DeviceGroupModalsActionsEnum.CREATE_NEW_GROUP,
    //         payload: {
    //             open: false,
    //             group: {
    //                 name: newGroupName,
    //                 ...group
    //             }
    //         }
    //     });
    // };

    const formLogic = useCreateNewGroupFormLogic(handleModalClose, createNewGroup?.group);

    const submitHandler = (values: { groupName: string }) => {
        console.log('Should create new group: ', values.groupName, createNewGroup);
    };

    const formProps = {
        ...formLogic,
        submitHandler
    };

    return { formProps, isOpen, handleModalClose };
};
