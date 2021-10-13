import { useNavigate } from 'react-router';

export const useMyDeviceGroupCardHeaderEffects = (link: string) => {
    const navigate = useNavigate();

    const clickHandler = () => {
        navigate(link);
    };

    return clickHandler;
};
