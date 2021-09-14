import { FC } from 'react';
import { Route, Routes } from 'react-router';
import { PageNotFound } from 'shared';
import { ProfilePage } from './pages';
import { UserAppEnvProvider, UserEnvVariables } from './context';

interface AccountAppProps {
    routesConfig: {
        showUserProfile: boolean;
    };
    envVariables: UserEnvVariables;
}

export const AccountApp: FC<AccountAppProps> = ({ routesConfig, envVariables }) => {
    const { showUserProfile } = routesConfig;
    return (
        <UserAppEnvProvider variables={envVariables}>
            <Routes>
                {showUserProfile && <Route path="profile" element={<ProfilePage />} />}
                <Route path="*" element={<PageNotFound />} />
            </Routes>
        </UserAppEnvProvider>
    );
};
