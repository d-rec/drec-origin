import { PageNotFound } from '@energyweb/origin-ui-core';
import { FC } from 'react';
import { Route, Routes } from 'react-router';
import { ProfilePage } from './pages';

interface AccountAppProps {
    routesConfig: {
        showUserProfile: boolean;
    };
}

export const AccountApp: FC<AccountAppProps> = ({ routesConfig }) => {
    const { showUserProfile } = routesConfig;
    return (
        <Routes>
            {showUserProfile && <Route path="profile" element={<ProfilePage />} />}
            <Route path="*" element={<PageNotFound />} />
        </Routes>
    );
};
