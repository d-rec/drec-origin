import { FC } from 'react';
import { LoginPage } from './pages';
import { UserModalsProvider } from './context';
import { UserModalsCenter } from './containers';

export const LoginApp: FC = () => {
    return (
        <UserModalsProvider>
            <LoginPage />
            <UserModalsCenter />
        </UserModalsProvider>
    );
};
