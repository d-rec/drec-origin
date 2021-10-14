import { DeviceGroupModalsActionsEnum } from './reducer';

export interface IDeviceGroupModalsStore {
    deviceGroupDelete: {
        open: boolean;
        groupId: number;
    };
}

interface IDeviceGroupDeleteAction {
    type: DeviceGroupModalsActionsEnum.SHOW_DELETE_GROUP;
    payload: {
        open: boolean;
        groupId: number;
    };
}

export type TDeviceGroupModalsAction = IDeviceGroupDeleteAction;
