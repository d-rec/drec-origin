import { UserDTO } from '@energyweb/origin-drec-api-client';
import { useApiUpdateUserAccountData } from 'apps/user/data';
import { useUpdateUserAccountDataFormConfig } from 'apps/user/logic';

export const useUpdateUserDataEffects = (user: UserDTO) => {
    const formConfig = useUpdateUserAccountDataFormConfig(user);
    const { submitHandler } = useApiUpdateUserAccountData();

    const formProps = {
        ...formConfig,
        submitHandler
    };

    return { formProps };
};
