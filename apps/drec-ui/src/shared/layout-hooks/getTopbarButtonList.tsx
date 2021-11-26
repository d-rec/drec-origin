import { TopBarButtonData } from '@energyweb/origin-ui-core';
import { HowToReg, AccountCircle, ExitToApp } from '@mui/icons-material';
import { NavigateFunction } from 'react-router';

export const getTopbarButtonList = (
    isAuthenticated: boolean,
    onLogout: () => void,
    navigate: NavigateFunction
): TopBarButtonData[] => {
    return [
        {
            label: 'Register',
            show: !isAuthenticated,
            onClick: () => {
                navigate('/auth/register');
            },
            Icon: HowToReg
        },
        {
            label: 'Login',
            show: !isAuthenticated,
            onClick: () => {
                navigate('/login');
            },
            Icon: AccountCircle
        },
        {
            label: 'Logout',
            show: !!isAuthenticated,
            onClick: onLogout,
            Icon: ExitToApp
        }
    ];
};
