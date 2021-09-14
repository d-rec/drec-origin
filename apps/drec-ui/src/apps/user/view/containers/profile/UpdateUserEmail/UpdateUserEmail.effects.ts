import { UserDTO } from '@energyweb/origin-drec-api-client';
import { GenericFormProps } from '@energyweb/origin-ui-core';
import { useApiUpdateUserAccountEmail } from 'apps/user/data';
import * as Yup from 'yup';

type TUpdateUserEmailFormValues = {
    email: string;
};

export const useUpdateUserEmailEffects = (initialUserData: UserDTO) => {
    const { submitHandler } = useApiUpdateUserAccountEmail();
    const formConfig: Omit<GenericFormProps<TUpdateUserEmailFormValues>, 'submitHandler'> = {
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
