// import React, { createContext, useContext, useReducer } from 'react';
// import { SamplevalueModalsReducer,SamplevalueModalsInitialState } from './reducer';
// import { ISampleValueModalsStore,TSampleValueModalsAction } from './types';

// const SampleValueModalsStore = createContext<ISampleValueModalsStore>(null);
// const SampleValueModalsDispatch = createContext<React.Dispatch<TSampleValueModalsAction>>(null);

// export const SampleValueModalsProvider: React.FC = ({ children }) => {
//     const [state, dispatch] = useReducer(SamplevalueModalsReducer, SamplevalueModalsInitialState);

//     return (
//         <SampleValueModalsStore.Provider value={state}>
//             <SampleValueModalsDispatch.Provider value={dispatch}>{children}</SampleValueModalsDispatch.Provider>
//         </SampleValueModalsStore.Provider>
//     );
// };

// export const useSampleValueModalsStore = () => {
//     return useContext(SampleValueModalsStore);
// };

// export const useSampleValueModalsDispatch = () => {
//     return useContext(SampleValueModalsDispatch);
// };
export { }