import { UnpackNestedValue } from 'react-hook-form';
import { GenericFormProps } from '@energyweb/origin-ui-core';
import { useNavigate } from 'react-router';
import * as Yup from 'yup';
import { useUserLogin } from 'apps/user/data';

export type TUserLoginFormValues = {
    username: string;
    password: string;
};

export const INITIAL_FORM_VALUES: TUserLoginFormValues = {
    username: '',
    password: ''
};

const useUserLogInFormConfig = (
    formSubmitHandler: (values: UnpackNestedValue<TUserLoginFormValues>) => void
): GenericFormProps<TUserLoginFormValues> => {
    return {
        buttonFullWidth: true,
        buttonText: 'Login',
        fields: [
            {
                label: 'Email',
                type: 'text',
                name: 'username'
            },
            {
                label: 'Password',
                type: 'password',
                name: 'password'
            }
        ],
        buttonWrapperProps: { justifyContent: 'flex-start' },
        initialValues: INITIAL_FORM_VALUES,
        submitHandler: formSubmitHandler,
        validationMode: 'onSubmit',
        inputsVariant: 'filled',
        validationSchema: Yup.object().shape({
            username: Yup.string().email().label('Email').required(),
            password: Yup.string().label('Password').required()
        })
    };
};

export const useLogInPageEffects = () => {
    const navigate = useNavigate();

    const submitHandler = useUserLogin();
    const formConfig = useUserLogInFormConfig(submitHandler);

    const navigateToRegister = () => {
        navigate('/auth/register');
    };

    return { formProps: formConfig, navigateToRegister };
};
