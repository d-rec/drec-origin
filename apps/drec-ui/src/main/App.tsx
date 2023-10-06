import { FC, memo } from 'react';
import { MainLayout, TMenuSection, TopBarButtonData } from '@energyweb/origin-ui-core';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UserDTO } from '@energyweb/origin-drec-api-client';
import { Box, CircularProgress } from '@mui/material';
import { useUserAndOrgData, PageNotFound } from 'shared';
import { DrecLogo } from 'assets';
import { CertificateApp } from 'apps/certificate';
import { AccountApp, AdminApp, AuthApp, ConfirmEmailApp, LoginApp } from 'apps/user';
import { OrganizationApp } from 'apps/organization';
import { DeviceGroupApp } from 'apps/device-group/view/DeviceGroupApp';
import {DeviceConfigApp} from 'apps/device/view/deviceConfigApp'
import {YieldConfigApp} from 'apps/yieldconfiguration/view/YieldConfigApp';

import {SampleConfigApp} from 'apps/sample/view/sampleConfigApp';
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
        const { accountRoutes, adminRoutes, orgRoutes, certificateRoutes, deviceGroupRoutes, deviceRoutes ,yieldRoutes,sampleRoutes } =
            routesConfig;
        return (
            <>
                {loading ? (
                    <Box
                        flex="row"
                        justifyContent="center"
                        alignItems="center"
                        sx={{ width: '100%', padding: 30 }}
                    >
                        <CircularProgress />
                    </Box>
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
                                path="device/*"
                                element={
                                    <DeviceConfigApp routesConfig={deviceRoutes}
                                    
                                    />
                                }
                            />
                            <Route
                                path="certificate/*"
                                element={
                                    <CertificateApp
                                        routesConfig={certificateRoutes}
                                        envVariables={{
                                            blockchainExplorerUrl:
                                                process.env.REACT_APP_BLOCKCHAIN_EXPLORER_URL
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
                                path="yieldvalue/*"
                                element={<YieldConfigApp routesConfig={yieldRoutes} />}
                            />
                              <Route
                                path="sample/*"
                                element={<SampleConfigApp routesConfig={sampleRoutes} />}
                            />
                            <Route
                                path="auth/*"
                                element={
                                    <AuthApp routesConfig={{ showRegister: !isAuthenticated }} />
                                }
                            />
                            <Route
                                path="account/*"
                                element={
                                    <AccountApp
                                        routesConfig={accountRoutes}
                                        envVariables={{
                                            registrationMessage:
                                                process.env.REACT_APP_REGISTRATION_MESSAGE_TO_SIGN,
                                            issuerAddress: process.env.REACT_APP_ISSUER_ADDRESS
                                        }}
                                    />
                                }
                            />
                            <Route path="/" element={<Navigate to="device-group/all" />} />
                            <Route path="*" element={<PageNotFound />} />
                        </Route>
                        <Route path="/login" element={<LoginApp />} />
                        <Route path="/confirm-email" element={<ConfirmEmailApp />} />
                    </Routes>
                )}
            </>
        );
    }
);

App.displayName = 'App';
