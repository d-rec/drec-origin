import { FC, memo } from 'react';
import { MainLayout, TMenuSection, TopBarButtonData } from '@energyweb/origin-ui-core';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UserDTO } from '@energyweb/origin-drec-api-client';
import { CircularProgress } from '@mui/material';
import { useUserAndOrgData, PageNotFound } from 'shared';
import { DrecLogo } from 'assets';
import { CertificateApp } from 'apps/certificate';
import { AccountApp, AdminApp, AuthApp, ConfirmEmailApp, LoginApp } from 'apps/user';
import { OrganizationApp } from 'apps/organization';
import { DeviceGroupApp } from 'apps/device-group/view/DeviceGroupApp';

import { RoutesConfig } from './AppContainer';

export interface AppProps {
    isAuthenticated: boolean;
    topbarButtons: TopBarButtonData[];
    user: UserDTO;
    menuSections: TMenuSection[];
    routesConfig: RoutesConfig;
    loading?: boolean;
}

export const App: FC<AppProps> = memo(
    ({ isAuthenticated, user, menuSections, topbarButtons, routesConfig, loading }) => {
        const { orgData, userData } = useUserAndOrgData(user);
        const { accountRoutes, adminRoutes, orgRoutes, certificateRoutes, deviceGroupRoutes } =
            routesConfig;
        return (
            <>
                {loading ? (
                    <CircularProgress />
                ) : (
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <MainLayout
                                    isAuthenticated={isAuthenticated}
                                    topbarButtons={topbarButtons}
                                    menuSections={menuSections}
                                    userData={userData}
                                    orgData={orgData}
                                    icon={<DrecLogo />}
                                    iconWrapperProps={{ my: 5, px: 2 }}
                                />
                            }
                        >
                            {loading ? (
                                <CircularProgress />
                            ) : (
                                <>
                                    <Route
                                        path="device-group/*"
                                        element={
                                            <DeviceGroupApp
                                                routesConfig={deviceGroupRoutes}
                                                envVariables={{
                                                    googleMapsApiKey:
                                                        process.env.REACT_APP_GOOGLE_MAPS_API_KEY
                                                }}
                                            />
                                        }
                                    />
                                    <Route
                                        path="certificate/*"
                                        element={
                                            <CertificateApp
                                                routesConfig={certificateRoutes}
                                                envVariables={{
                                                    googleMapsApiKey:
                                                        process.env.REACT_APP_GOOGLE_MAPS_API_KEY
                                                }}
                                            />
                                        }
                                    />
                                    <Route
                                        path="organization/*"
                                        element={<OrganizationApp routesConfig={orgRoutes} />}
                                    />
                                    <Route
                                        path="admin/*"
                                        element={<AdminApp routesConfig={adminRoutes} />}
                                    />
                                    <Route
                                        path="auth/*"
                                        element={
                                            <AuthApp
                                                routesConfig={{ showRegister: !isAuthenticated }}
                                            />
                                        }
                                    />
                                    <Route
                                        path="account/*"
                                        element={
                                            <AccountApp
                                                routesConfig={accountRoutes}
                                                envVariables={{
                                                    registrationMessage:
                                                        process.env
                                                            .REACT_APP_REGISTRATION_MESSAGE_TO_SIGN,
                                                    issuerAddress:
                                                        process.env.REACT_APP_ISSUER_ADDRESS
                                                }}
                                            />
                                        }
                                    />
                                    <Route element={<Navigate to="device-group/all" />} />
                                </>
                            )}
                        </Route>
                        <Route path="/login" element={<LoginApp />} />
                        <Route path="/confirm-email" element={<ConfirmEmailApp />} />
                        {!loading && <Route path="*" element={<PageNotFound />} />}
                    </Routes>
                )}
            </>
        );
    }
);

App.displayName = 'App';
