import React, { createContext, useContext, useReducer } from 'react';
import { yieldvalueModalsReducer,yieldvalueModalsInitialState } from './reducer';
import { IYielsValueModalsStore,TYieldValueModalsAction } from './types';

const YieldValueModalsStore = createContext<IYielsValueModalsStore>(null);
const YieldValueModalsDispatch = createContext<React.Dispatch<TYieldValueModalsAction>>(null);

export const YieldValueModalsProvider: React.FC = ({ children }) => {
    const [state, dispatch] = useReducer(yieldvalueModalsReducer, yieldvalueModalsInitialState);

    return (
        <YieldValueModalsStore.Provider value={state}>
            <YieldValueModalsDispatch.Provider value={dispatch}>{children}</YieldValueModalsDispatch.Provider>
        </YieldValueModalsStore.Provider>
    );
};

export const useYieldValueModalsStore = () => {
    return useContext(YieldValueModalsStore);
};

export const useYieldValueModalsDispatch = () => {
    return useContext(YieldValueModalsDispatch);
};