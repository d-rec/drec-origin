import { useNavigate } from 'react-router';
import { DeviceGroupModalsActionsEnum, useDeviceGroupModalsDispatch } from '../../../context';

export const useMyDeviceGroupCardHeaderEffects = (link: string, id: number) => {
    const navigate = useNavigate();
    const dispatchModals = useDeviceGroupModalsDispatch();

    const clickHandler = () => {
        navigate(link);
    };

    const deleteHandler = () => {
        dispatchModals({
            type: DeviceGroupModalsActionsEnum.SHOW_DELETE_GROUP,
            payload: {
                open: true,
                groupId: id
            }
        });
    };

    return { clickHandler, deleteHandler };
};
