import { FC } from 'react';
import { Route, Routes } from 'react-router-dom';
import { PageNotFound } from 'shared';
import { AllDevicesPage, DetailViewPage, MyDevicesPage, MapViewPage } from './pages';
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
    const { showAllDevices, showMapView, showMyDevices } = routesConfig;
    return (
        <DeviceAppEnvProvider variables={envVariables}>
            <Routes>
                {showAllDevices && <Route path="all" element={<AllDevicesPage />} />}
                {showMyDevices && <Route path="my" element={<MyDevicesPage />} />}
                {showMapView && <Route path="map" element={<MapViewPage />} />}
                {showAllDevices && <Route path="detail-view/:id" element={<DetailViewPage />} />}
                <Route path="*" element={<PageNotFound />} />
            </Routes>
        </DeviceAppEnvProvider>
    );
};
