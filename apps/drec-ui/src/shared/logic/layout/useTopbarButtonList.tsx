import { TopBarButtonData } from '../../../core';
import { useNavigate } from 'react-router';
import { HowToReg, AccountCircle, ExitToApp } from '@material-ui/icons';

export const useTopbarButtonList = (
    isAuthenticated: boolean,
    onLogout: () => void
): TopBarButtonData[] => {
    const navigate = useNavigate();

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
            show: isAuthenticated,
            onClick: onLogout,
            Icon: ExitToApp
        }
    ];
};
