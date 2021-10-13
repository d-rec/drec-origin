import { FC } from 'react';
import { Route, Routes } from 'react-router-dom';
import { PageNotFound } from 'shared';
import { AllDeviceGroupsPage, MyDeviceGroupsPage } from './pages';
import { DeviceGroupAppEnvProvider, DeviceGroupEnvVariables } from './context';

export interface DeviceGroupAppProps {
    routesConfig: {
        showAllDeviceGroups: boolean;
        showMyDeviceGroups: boolean;
    };
    envVariables: DeviceGroupEnvVariables;
}

export const DeviceGroupApp: FC<DeviceGroupAppProps> = ({ routesConfig, envVariables }) => {
    const { showAllDeviceGroups, showMyDeviceGroups } = routesConfig;
    return (
        <DeviceGroupAppEnvProvider variables={envVariables}>
            <Routes>
                {showAllDeviceGroups && <Route path="all" element={<AllDeviceGroupsPage />} />}
                {showMyDeviceGroups && <Route path="my" element={<MyDeviceGroupsPage />} />}
                <Route path="*" element={<PageNotFound />} />
            </Routes>
        </DeviceGroupAppEnvProvider>
    );
};
