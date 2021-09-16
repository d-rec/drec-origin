import { useParams } from 'react-router';
import { useAdminGetUser, useAdminUpdateUser } from 'apps/user/data';
import { useAdminUpdateUserFormLogic } from 'apps/user/logic';

export const useAdminUpdateUserPageEffects = () => {
    const { id } = useParams();
    const { user, isLoading } = useAdminGetUser(id);
    const submitHandler = useAdminUpdateUser(id);
    const formConfig = useAdminUpdateUserFormLogic(user);

    const formProps = {
        ...formConfig,
        submitHandler
    };

    return { formProps, isLoading };
};
