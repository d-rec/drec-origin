import { FC } from 'react';
import { Route, Routes } from 'react-router-dom';
import { DashboardPage } from 'pages';

export const App: FC = () => {
    return (
        <Routes>
            <Route path="dashboard" element={<DashboardPage />} />
        </Routes>
    );
};
