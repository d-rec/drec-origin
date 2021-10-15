import { FC } from 'react';
import { Route, Routes } from 'react-router-dom';
import { PageNotFound } from 'shared';
import { AllDeviceGroupsPage, MyDeviceGroupsPage } from './pages';
import {
    DeviceGroupAppEnvProvider,
    DeviceGroupEnvVariables,
    DeviceGroupModalsProvider
} from './context';
import { DeviceGroupModalsCenter } from './containers/modals/DeviceGroupModalsCenter';

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
            <DeviceGroupModalsProvider>
                <Routes>
                    {showAllDeviceGroups && <Route path="all" element={<AllDeviceGroupsPage />} />}
                    {showMyDeviceGroups && <Route path="my" element={<MyDeviceGroupsPage />} />}
                    <Route path="*" element={<PageNotFound />} />
                </Routes>
                <DeviceGroupModalsCenter />
            </DeviceGroupModalsProvider>
        </DeviceGroupAppEnvProvider>
    );
};
