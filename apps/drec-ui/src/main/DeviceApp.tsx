import React, { FC } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AllDevicesPage } from '../device';
import { PageNotFound } from '../pages';

export interface DeviceAppProps {
    routesConfig: {
        showAllDevices: boolean;
        showMapView: boolean;
        showMyDevices: boolean;
        showRegisterDevice: boolean;
    };
}

export const DeviceApp: FC<DeviceAppProps> = ({ routesConfig }) => {
    const { showAllDevices, showMapView, showMyDevices, showRegisterDevice } = routesConfig;
    return (
        <Routes>
            {showAllDevices && <Route path="all" element={<AllDevicesPage />} />}
            <Route path="*" element={<PageNotFound />} />
        </Routes>
    );
};
