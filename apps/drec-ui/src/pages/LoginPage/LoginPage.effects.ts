import { useUserLogin } from '../../api';
import { UserModalsActionsEnum, useUserModalsDispatch } from '../../user';
import { UnpackNestedValue } from 'react-hook-form';
import { GenericFormProps } from '../../core';

import * as Yup from 'yup';

export type TUserLoginFormValues = {
    username: string;
    password: string;
};

export const INITIAL_FORM_VALUES: TUserLoginFormValues = {
    username: '',
    password: ''
};

export const useLogInPageEffects = () => {
    const dispatchModals = useUserModalsDispatch();
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
            validationMode: 'onTouched',
            inputsVariant: 'filled',
            validationSchema: Yup.object().shape({
                username: Yup.string().email().label('Email').required(),
                password: Yup.string().label('Password').required()
            })
        };
    };

    const openRegisterOrgModal = () => {
        dispatchModals({
            type: UserModalsActionsEnum.SHOW_LOGIN_REGISTER_ORG,
            payload: true
        });
    };
    const submitHandler = useUserLogin(openRegisterOrgModal);
    const formConfig = useUserLogInFormConfig(submitHandler);

    return { formProps: formConfig };
};
