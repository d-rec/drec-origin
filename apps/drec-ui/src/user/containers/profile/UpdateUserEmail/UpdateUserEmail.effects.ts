import { UserDTO } from '@energyweb/origin-drec-api-client';
import { useApiUpdateUserAccountEmail } from '../../../../api';
import * as Yup from 'yup';

export const useUpdateUserEmailEffects = (initialUserData: UserDTO) => {
    const { submitHandler } = useApiUpdateUserAccountEmail();
    const formConfig = {
        buttonText: 'Change',
        fields: [
            {
                label: 'Email',
                name: 'email',
                required: true
            }
        ],
        buttonWrapperProps: { justifyContent: 'flex-start' },
        initialValues: { email: initialUserData?.email },
        inputsVariant: 'filled',
        validationSchema: Yup.object().shape({
            email: Yup.string().email().label('Email').required()
        })
    };

    const formProps = {
        ...formConfig,
        submitHandler
    };

    return { formProps };
};
