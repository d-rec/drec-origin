import { FC } from 'react';
import { LoginPage } from './pages';
import { UserModalsProvider, UserModalsCenter } from '.';

export const LoginApp: FC = () => {
    return (
        <UserModalsProvider>
            <LoginPage />
            <UserModalsCenter />
        </UserModalsProvider>
    );
};
