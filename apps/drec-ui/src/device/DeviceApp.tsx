import React, { FC } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AllDevicesPage, DetailViewPage, MyDevicesPage } from './pages';
import { PageNotFound } from '../pages';
import { DeviceAppEnvProvider, DeviceEnvVariables } from './context';

export interface DeviceAppProps {
    routesConfig: {
        showAllDevices: boolean;
        showMapView: boolean;
        showMyDevices: boolean;
        showRegisterDevice: boolean;
    };
    envVariables: DeviceEnvVariables;
}

export const DeviceApp: FC<DeviceAppProps> = ({ routesConfig, envVariables }) => {
    const { showAllDevices, showMapView, showMyDevices, showRegisterDevice } = routesConfig;
    return (
        <DeviceAppEnvProvider variables={envVariables}>
            <Routes>
                {showAllDevices && <Route path="all" element={<AllDevicesPage />} />}
                {showAllDevices && <Route path="detail-view/:id" element={<DetailViewPage />} />}
                {showMyDevices && <Route path="my" element={<MyDevicesPage />} />}
                <Route path="*" element={<PageNotFound />} />
            </Routes>
        </DeviceAppEnvProvider>
    );
};
