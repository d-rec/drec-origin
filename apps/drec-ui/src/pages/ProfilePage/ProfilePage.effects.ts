import { useUser } from '../../api';

export const useProfilePageEffects = () => {
    const { user, userLoading } = useUser();

    return { user, userLoading };
};
