import { IDeviceGroupModalsStore, TDeviceGroupModalsAction } from './types';

export enum DeviceGroupModalsActionsEnum {
    SHOW_DELETE_GROUP = 'SHOW_DELETE_GROUP'
}

export const deviceGroupModalsInitialState: IDeviceGroupModalsStore = {
    deviceGroupDelete: {
        open: false,
        groupId: null
    }
};

export const deviceGroupModalsReducer = (
    state = deviceGroupModalsInitialState,
    action: TDeviceGroupModalsAction
): IDeviceGroupModalsStore => {
    switch (action.type) {
        case DeviceGroupModalsActionsEnum.SHOW_DELETE_GROUP:
            return { ...state, deviceGroupDelete: action.payload };
    }
};
