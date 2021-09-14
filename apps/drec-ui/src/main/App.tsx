import { FC, memo } from 'react';
import { MainLayout, TMenuSection, TopBarButtonData } from '@energyweb/origin-ui-core';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UserDTO } from '@energyweb/origin-drec-api-client';

import { useUserAndOrgData, PageNotFound } from 'shared';
import { DrecLogo } from 'assets';
import { CertificateApp } from 'apps/certificate';
import { AccountApp, AuthApp, ConfirmEmailApp, LoginApp } from 'apps/user';
import { DeviceApp } from 'apps/device';
import { OrganizationApp } from 'apps/organization';

import { RoutesConfig } from './AppContainer';

export interface AppProps {
    isAuthenticated: boolean;
    topbarButtons: TopBarButtonData[];
    user: UserDTO;
    menuSections: TMenuSection[];
    routesConfig: RoutesConfig;
}

export const App: FC<AppProps> = memo(
    ({ isAuthenticated, user, menuSections, topbarButtons, routesConfig }) => {
        const { orgData, userData } = useUserAndOrgData(user);
        const { accountRoutes, adminRoutes, orgRoutes, deviceRoutes, certificateRoutes } =
            routesConfig;
        return (
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
                    <Route
                        path="device/*"
                        element={
                            <DeviceApp
                                routesConfig={deviceRoutes}
                                envVariables={{
                                    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY
                                }}
                            />
                        }
                    />
                    {/* Hiding this page until device grouping is done */}
                    {/* <Route
                        path="certificate/*"
                        element={
                            <CertificateApp
                                routesConfig={certificateRoutes}
                                envVariables={{
                                    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY
                                }}
                            />
                        }
                    /> */}
                    <Route
                        path="organization/*"
                        element={<OrganizationApp routesConfig={orgRoutes} />}
                    />
                    <Route
                        path="auth/*"
                        element={<AuthApp routesConfig={{ showRegister: !isAuthenticated }} />}
                    />
                    <Route
                        path="account/*"
                        element={
                            <AccountApp
                                routesConfig={accountRoutes}
                                envVariables={{
                                    registrationMessage:
                                        process.env.REACT_APP_REGISTRATION_MESSAGE_TO_SIGN
                                }}
                            />
                        }
                    />
                    <Route element={<Navigate to="device/all" />} />
                </Route>
                <Route path="/login" element={<LoginApp />} />
                <Route path="/confirm-email" element={<ConfirmEmailApp />} />
                <Route path="*" element={<PageNotFound />} />
            </Routes>
        );
    }
);

App.displayName = 'App';
