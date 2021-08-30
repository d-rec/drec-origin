import { FC, memo } from 'react';
import {
    MainLayout,
    PageNotFound,
    TMenuSection,
    TopBarButtonData
} from '@energyweb/origin-ui-core';
import { LoginApp } from '../LoginApp';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UserDTO } from '@energyweb/origin-drec-api-client';
import { useUserAndOrgData } from '../shared';
import { DashboardPage } from 'pages';
import { DrecLogo } from 'assets';
import { AccountApp } from '../AccountApp';
import { RoutesConfig } from '../AppContainer';

export interface AppProps {
    isAuthenticated: boolean;
    topbarButtons: TopBarButtonData[];
    user: UserDTO;
    menuSections: TMenuSection[];
    routesConfig: RoutesConfig;
}

const App: FC<AppProps> = memo(
    ({ isAuthenticated, user, menuSections, topbarButtons, routesConfig }) => {
        const { orgData, userData } = useUserAndOrgData(user);
        const { accountRoutes, adminRoutes, orgRoutes, deviceRoutes } = routesConfig;

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
                    <Route path="account/*" element={<AccountApp routesConfig={accountRoutes} />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route element={<Navigate to="dashboard" />} />
                </Route>
                <Route path="/login" element={<LoginApp />} />
                <Route path="*" element={<PageNotFound />} />
            </Routes>
        );
    }
);

App.displayName = 'App';

export default App;
