import { createContext, useContext } from 'react';
import { FC } from 'react';

export type DeviceGroupEnvVariables = {
    googleMapsApiKey: string;
};

const DeviceGroupAppEnv = createContext<DeviceGroupEnvVariables>(null);

interface DeviceGroupAppEnvProviderProps {
    variables: DeviceGroupEnvVariables;
}

export const DeviceGroupAppEnvProvider: FC<DeviceGroupAppEnvProviderProps> = ({
    variables,
    children
}) => {
    return <DeviceGroupAppEnv.Provider value={variables}>{children}</DeviceGroupAppEnv.Provider>;
};

export const useDeviceGroupAppEnv = () => {
    return useContext(DeviceGroupAppEnv);
};
