import { FC } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { UserDTO } from '@energyweb/origin-drec-api-client';
import { DashboardPage } from 'pages';
import { useAxiosInterceptors } from 'api';
import { useUser } from 'api';
import { LoginApp } from './LoginApp';
import { PageNotFound } from './core';
import { MainLayout } from './components';

export const App: FC = () => {
    useAxiosInterceptors();
    const { isAuthenticated, userLoading } = useUser();

    return (
        !userLoading && (
            <Routes>
                <Route
                    path="/"
                    element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" />}
                >
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route element={<Navigate to="dashboard" />} />
                </Route>
                <Route path="/login" element={<LoginApp />} />
                <Route path="*" element={<PageNotFound />} />
            </Routes>
        )
    );
};
