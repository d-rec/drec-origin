import React, { createContext, useContext, useReducer } from 'react';
import { deviceGroupModalsInitialState, deviceGroupModalsReducer } from './reducer';
import { IDeviceGroupModalsStore, TDeviceGroupModalsAction } from './types';

const DeviceGroupModalsStore = createContext<IDeviceGroupModalsStore>(null);
const DeviceGroupModalsDispatch = createContext<React.Dispatch<TDeviceGroupModalsAction>>(null);

export const DeviceGroupModalsProvider: React.FC = ({ children }) => {
    const [state, dispatch] = useReducer(deviceGroupModalsReducer, deviceGroupModalsInitialState);

    return (
        <DeviceGroupModalsStore.Provider value={state}>
            <DeviceGroupModalsDispatch.Provider value={dispatch}>
                {children}
            </DeviceGroupModalsDispatch.Provider>
        </DeviceGroupModalsStore.Provider>
    );
};

export const useDeviceGroupModalsStore = () => {
    return useContext(DeviceGroupModalsStore);
};

export const useDeviceGroupModalsDispatch = () => {
    return useContext(DeviceGroupModalsDispatch);
};
