import React, { FC } from 'react';

import { Route, Routes } from 'react-router';
import { AdminUsersPage, AdminUpdateUserPage } from './pages';
import { PageNotFound } from 'shared';

interface AdminAppProps {
    routesConfig: {
        showUsers: boolean;
    };
}

export const AdminApp: FC<AdminAppProps> = ({ routesConfig }) => {
    const { showUsers } = routesConfig;
    return (
        <Routes>
            {showUsers && <Route path="users" element={<AdminUsersPage />} />}
            {showUsers && <Route path="update-user/:id" element={<AdminUpdateUserPage />} />}
            <Route path="*" element={<PageNotFound />} />
        </Routes>
    );
};
