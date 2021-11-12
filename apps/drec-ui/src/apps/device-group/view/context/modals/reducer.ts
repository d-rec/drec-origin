import { IDeviceGroupModalsStore, TDeviceGroupModalsAction } from './types';

export enum DeviceGroupModalsActionsEnum {
    SHOW_DELETE_GROUP = 'SHOW_DELETE_GROUP',
    AUTO_GROUP_SELECTED = 'AUTO_GROUP_SELECTED',
    CREATE_NEW_GROUP = 'CREATE_NEW_GROUP',
    RESERVE = 'RESERVE',
    UNRESERVE = 'UNRESERVE'
}

export const deviceGroupModalsInitialState: IDeviceGroupModalsStore = {
    deviceGroupDelete: {
        open: false,
        groupId: null
    },
    autoGroupSelected: {
        open: false,
        selected: [],
        groupRules: []
    },
    createNewGroup: {
        open: false,
        group: null
    },
    reserveSelected: {
        open: false,
        selected: []
    },
    unreserveSelected: {
        open: false,
        selected: []
    }
};

export const deviceGroupModalsReducer = (
    state = deviceGroupModalsInitialState,
    action: TDeviceGroupModalsAction
): IDeviceGroupModalsStore => {
    switch (action.type) {
        case DeviceGroupModalsActionsEnum.SHOW_DELETE_GROUP:
            return { ...state, deviceGroupDelete: action.payload };
        case DeviceGroupModalsActionsEnum.AUTO_GROUP_SELECTED:
            return { ...state, autoGroupSelected: action.payload };
        case DeviceGroupModalsActionsEnum.CREATE_NEW_GROUP:
            return { ...state, createNewGroup: action.payload };
        case DeviceGroupModalsActionsEnum.RESERVE:
            return { ...state, reserveSelected: action.payload };
        case DeviceGroupModalsActionsEnum.UNRESERVE:
            return { ...state, unreserveSelected: action.payload };
    }
};
