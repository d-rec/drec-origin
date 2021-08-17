import React, { FC, memo } from 'react';
import { MainLayout, PageNotFound, TMenuSection, TopBarButtonData } from '../core';
import { LoginApp } from '../LoginApp';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UserDTO, OrganizationDTO } from '@energyweb/origin-drec-api-client';
import { useUserAndOrgData } from '../shared';
import { DashboardPage } from 'pages';

export interface AppProps {
    isAuthenticated: boolean;
    topbarButtons: TopBarButtonData[];
    user: UserDTO;
    organization: OrganizationDTO;
    menuSections: TMenuSection[];
}

const App: FC<AppProps> = memo(
    ({ isAuthenticated, user, organization, menuSections, topbarButtons }) => {
        const { orgData, userData } = useUserAndOrgData(user, organization);

        return (
            <Routes>
                <Route
                    path="/"
                    element={
                        isAuthenticated ? (
                            <MainLayout
                                isAuthenticated={isAuthenticated}
                                topbarButtons={topbarButtons}
                                menuSections={menuSections}
                                userData={userData}
                                orgData={orgData}
                            />
                        ) : (
                            <Navigate to="/login" />
                        )
                    }
                >
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
