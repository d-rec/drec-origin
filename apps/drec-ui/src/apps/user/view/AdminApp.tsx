import React, { FC } from 'react';

import { Route, Routes } from 'react-router';
import {
    AdminUsersPage,
    AdminUpdateUserPage,
    AllOrganizationsPage,
    AdminUpdateOrganizationPage
} from './pages';
import { PageNotFound } from 'shared';

interface AdminAppProps {
    routesConfig: {
        showUsers: boolean;
        showAllOrgs: boolean;
    };
}

export const AdminApp: FC<AdminAppProps> = ({ routesConfig }) => {
    const { showUsers, showAllOrgs } = routesConfig;
    return (
        <Routes>
            {showUsers && <Route path="users" element={<AdminUsersPage />} />}
            {showUsers && <Route path="update-user/:id" element={<AdminUpdateUserPage />} />}
            {showAllOrgs && <Route path="organizations" element={<AllOrganizationsPage />} />}
            {showAllOrgs && (
                <Route path="update-organization/:id" element={<AdminUpdateOrganizationPage />} />
            )}
            <Route path="*" element={<PageNotFound />} />
        </Routes>
    );
};
