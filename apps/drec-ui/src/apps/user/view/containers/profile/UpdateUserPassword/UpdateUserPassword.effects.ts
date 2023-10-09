import { useApiUpdateUserAccountPassword } from 'apps/user/data';
import { GenericFormProps } from '@energyweb/origin-ui-core';
import * as Yup from 'yup';

export type TUpdateUserPasswordFormValues = {
    oldPassword: string;
    newPassword: string;
    newPasswordConfirm: string;
};

const INITIAL_FORM_VALUES = {
    oldPassword: '',
    newPassword: '',
    newPasswordConfirm: ''
};

export const useUpdateUserPasswordEffects = () => {
    const { submitHandler } = useApiUpdateUserAccountPassword();
    const formConfig: Omit<GenericFormProps<TUpdateUserPasswordFormValues>, 'submitHandler'> = {
        buttonText: 'Save',
        fields: [
            {
                type: 'password',
                label: 'Current Password',
                name: 'oldPassword',
                required: true
            },
            {
                type: 'password',
                label: 'New Password',
                name: 'newPassword',
                required: true
            },
            {
                type: 'password',
                label: 'New Password Confirm',
                name: 'newPasswordConfirm',
                required: true
            }
        ],
        buttonWrapperProps: { justifyContent: 'flex-start' },
        initialValues: INITIAL_FORM_VALUES,
        inputsVariant: 'filled' as any,
        validationSchema: Yup.object().shape({
            oldPassword: Yup.string().label('Current Password').required(),
            newPassword: Yup.string().label('New Password').required(),
            newPasswordConfirm: Yup.string()
                .oneOf(
                    [Yup.ref('newPassword'), null],
                    `Confirmed password doesn't match with new password`
                )
                .label('Confirm Password')
                .required()
        })
    };

    const formProps = {
        ...formConfig,
        submitHandler
    };

    return { formProps };
};
